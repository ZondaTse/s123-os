'use strict';
const router = require('express').Router();
const auth = require('../middleware/auth');
const { db } = require('../db');
const https = require('https');
const crypto = require('crypto');

const KM_APPKEY  = process.env.KM_APPKEY  || '25795669';
const KM_SECRET  = process.env.KM_SECRET  || 'c8a3cfaef38b4efd814eae9d2f2260b9';
const KM_SESSION = process.env.KM_SESSION || 'e7af4f59706d452fa44f85c8cdf4d767';
const KM_GATEWAY = 'gw.superboss.cc';

function nowStamp() {
  return new Date(Date.now() + 8 * 3600000).toISOString().slice(0, 19).replace('T', ' ');
}

function kuaimaiSign(params, method = 'hmac') {
  const keys = Object.keys(params)
    .filter(k => k !== 'sign' && params[k] !== null && params[k] !== undefined && params[k] !== '')
    .sort();
  let base = '';
  for (const k of keys) base += k + params[k];
  if (method === 'hmac-sha256') {
    return crypto.createHmac('sha256', KM_SECRET).update(base).digest('hex').toUpperCase();
  }
  // 默认 hmac (hmac-md5)
  return crypto.createHmac('md5', KM_SECRET).update(base).digest('hex').toUpperCase();
}

function kuaimaiRequest(method, extraParams, signMethod = 'hmac') {
  return new Promise((resolve, reject) => {
    const params = {
      method,
      appKey: KM_APPKEY,
      session: KM_SESSION,
      timestamp: nowStamp(),
      format: 'json',
      version: '1.0',
      sign_method: signMethod,
      ...extraParams,
    };
    params.sign = kuaimaiSign(params, signMethod);

    const body = Object.keys(params)
      .map(k => encodeURIComponent(k) + '=' + encodeURIComponent(params[k]))
      .join('&');

    const req = https.request({
      hostname: KM_GATEWAY,
      path: '/router',
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded;charset=UTF-8',
        'Content-Length': Buffer.byteLength(body),
      },
    }, res => {
      let data = '';
      res.on('data', d => data += d);
      res.on('end', () => {
        try { resolve(JSON.parse(data)); }
        catch { reject(new Error('快麦返回非JSON: ' + data.slice(0, 100))); }
      });
    });
    req.on('error', reject);
    req.setTimeout(15000, () => { req.destroy(); reject(new Error('快麦请求超时')); });
    req.write(body);
    req.end();
  });
}

// GET /api/kuaima/goods?sku=xxx
// 根据款号查询快麦商品信息
// 主接口：erp.item.warehouse.list.get（查询仓库及商品库存信息）
// 备用接口：erp.item.list.query
router.get('/goods', auth, async (req, res) => {
  const sku = (req.query.sku || '').trim();
  if (!sku) return res.status(400).json({ error: '请提供款号' });

  try {
    let found = null;
    let lastData = null;

    // 主接口：erp.item.warehouse.list.get
    // outerId = 平台商家编码（款号），pageNo 必填
    const warehouseAttempts = [
      { outerId: sku },
      { skuOuterId: sku },
    ];

    for (const extraParams of warehouseAttempts) {
      const data = await kuaimaiRequest('erp.item.warehouse.list.get', {
        ...extraParams,
        pageNo: 1,
        pageSize: 20,
      }, 'hmac');
      lastData = data;

      if (!data.success) {
        const code = String(data.code || '');
        if (code === '401' || code === '25') {
          return res.status(401).json({ error: '签名错误或权限不足: ' + (data.msg || ''), raw: data });
        }
        continue;
      }

      const list = data.stockStatusVoList || [];
      if (list.length) {
        // 把同款的所有SKU聚合成一条商品
        const first = list[0];
        found = {
          _source: 'warehouse',
          name: first.title || first.shortTitle || sku,
          price: parseFloat(first.sellingPrice || first.marketPrice || 0) / 100,
          cost: parseFloat(first.purchasePrice || 0) / 100,
          stock: list.reduce((sum, s) => sum + (s.totalAvailableStock || 0), 0),
          image_url: first.picPath || first.skuPicPath || null,
          outer_id: first.mainOuterId || first.outerId || '',
          sys_item_id: String(first.sysItemId || ''),
          skus: list.map(s => ({
            sku_id: String(s.sysSkuId || ''),
            properties: s.propertiesName || '',
            stock: s.totalAvailableStock || 0,
            lock_stock: s.totalLockStock || 0,
            price: parseFloat(s.sellingPrice || 0) / 100,
            outer_sku_id: s.outerId || '',
            barcode: s.skuBarcode || s.itemBarcode || '',
          })),
          raw: list,
        };
        break;
      }
    }

    // 备用接口：erp.item.list.query
    if (!found) {
      const fallbackAttempts = [
        { sysOuterId: sku },
        { outerId: sku },
      ];
      for (const extraParams of fallbackAttempts) {
        const data = await kuaimaiRequest('erp.item.list.query', {
          ...extraParams,
          pageNo: 1,
          pageSize: 10,
        }, 'hmac');
        lastData = data;

        if (!data.success) continue;

        const list = data.items || data.goodsList || data.list || [];
        if (list.length) {
          const g = list[0];
          found = {
            _source: 'item_list',
            name: g.name || g.goodsName || g.title || sku,
            price: parseFloat(g.retailPrice || g.price || g.salePrice || 0),
            cost: parseFloat(g.purchasePrice || g.costPrice || 0),
            stock: parseInt(g.totalStock || g.stock || g.remainStock || 0),
            image_url: g.picUrl || g.mainPic || g.imgUrl || null,
            outer_id: g.outerId || g.sysOuterId || '',
            sys_item_id: String(g.sysItemId || g.id || ''),
            skus: (g.skuList || g.skus || []).map(s => ({
              sku_id: s.skuId || s.sysSkuId || s.outerSkuId,
              properties: s.properties || s.specName || s.spec || '',
              stock: s.stock || s.remainStock || 0,
              price: s.retailPrice || s.price || g.retailPrice || 0,
              outer_sku_id: s.outerSkuId || s.skuOuterId || '',
            })),
            raw: g,
          };
          break;
        }
      }
    }

    if (!found) {
      return res.json({ found: false, message: '快麦未找到该款号，请检查商家编码是否正确', raw: lastData });
    }

    res.json({ found: true, ...found });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// POST /api/kuaima/sync-product
// 同步快麦商品数据到本地products表
router.post('/sync-product', auth, async (req, res) => {
  const { product_id, sku } = req.body;
  if (!product_id || !sku) return res.status(400).json({ error: '缺少参数' });

  try {
    // 优先用 warehouse 接口，能拿到库存+价格+SKU
    let name, price, cost, stock, image_url;
    const warehouseData = await kuaimaiRequest('erp.item.warehouse.list.get', {
      outerId: sku,
      pageNo: 1,
      pageSize: 20,
    }, 'hmac');

    if (warehouseData.success && (warehouseData.stockStatusVoList || []).length) {
      const list = warehouseData.stockStatusVoList;
      const first = list[0];
      name = first.title || first.shortTitle || sku;
      price = parseFloat(first.sellingPrice || first.marketPrice || 0) / 100;
      cost = parseFloat(first.purchasePrice || 0) / 100;
      stock = list.reduce((sum, s) => sum + (s.totalAvailableStock || 0), 0);
      image_url = first.picPath || first.skuPicPath || null;
    } else {
      // 备用 item.list.query
      const data = await kuaimaiRequest('erp.item.list.query', {
        sysOuterId: sku,
        pageNo: 1,
        pageSize: 10,
      }, 'hmac');
      if (!data.success) return res.status(400).json({ error: data.msg || '快麦查询失败' });
      const list = data.goodsList || data.list || [];
      if (!list.length) return res.json({ found: false, message: '快麦未找到该款号' });
      const goods = list[0];
      name = goods.goodsName || goods.title || sku;
      price = parseFloat(goods.price || goods.salePrice || 0);
      cost = parseFloat(goods.costPrice || goods.purchasePrice || 0);
      stock = parseInt(goods.stock || goods.totalStock || 0);
      image_url = goods.picUrl || goods.mainPic || null;
    }

    // 更新本地数据库
    const updates = ['name=?', 'price=?', 'cost=?', 'stock=?', 'updated_at=datetime(\'now\',\'localtime\')'];
    const params = [name, price, cost, stock];
    if (image_url) { updates.push('image_url=?'); params.push(image_url); }
    params.push(product_id);

    db.prepare(`UPDATE products SET ${updates.join(',')} WHERE id=?`).run(...params);

    const updated = db.prepare('SELECT * FROM products WHERE id=?').get(product_id);
    res.json({ found: true, product: updated });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

module.exports = router;

// 临时调试：GET /api/kuaima/debug?sku=xxx 返回所有尝试的原始结果

router.get('/debug', auth, async (req, res) => {
  const sku = (req.query.sku || '').trim();
  if (!sku) return res.status(400).json({ error: '请提供sku参数' });
  const results = [];
  for (const method of ['erp.item.list.query', 'erp.item.single.get']) {
    for (const [key, val] of [['sysOuterId', sku], ['outerId', sku]]) {
      try {
        const data = await kuaimaiRequest(method, { [key]: val, pageNo: 1, pageSize: 3 }, 'hmac');
        const list = data.items || data.goodsList || data.list || [];
        results.push({ method, key, val, success: data.success, code: data.code, msg: data.msg, count: list.length, sample: list[0] || null });
      } catch(e) {
        results.push({ method, key, val, error: e.message });
      }
    }
  }
  res.json({ results });
});
