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
// 实际返回结构: { outerId, skus:[{ skuOuterId, mainWareHousesStock:[...] }], success }
// 注意: warehouse接口只返回库存，无商品名/价格/图片
router.get('/goods', auth, async (req, res) => {
  const sku = (req.query.sku || '').trim();
  if (!sku) return res.status(400).json({ error: '请提供款号' });

  try {
    let result = null;
    let lastData = null;

    // 主接口：erp.item.warehouse.list.get，outerId = 款级别商家编码（如 S123-2604K4237）
    const data = await kuaimaiRequest('erp.item.warehouse.list.get', {
      outerId: sku,
      pageNo: 1,
      pageSize: 50,
    }, 'hmac');
    lastData = data;

    if (data.success && (data.skus || []).length) {
      // 聚合所有SKU的默认仓库可用库存
      const skus = data.skus.map(s => {
        const mainStock = (s.mainWareHousesStock || []).find(w => w.code === 'A') || s.mainWareHousesStock[0] || {};
        return {
          sku_outer_id: s.skuOuterId || '',
          stock: mainStock.totalAvailableStock || 0,
          lock_stock: mainStock.totalLockStock || 0,
          warehouses: (s.mainWareHousesStock || []).map(w => ({
            name: w.name,
            code: w.code,
            stock: w.totalAvailableStock || 0,
            lock: w.totalLockStock || 0,
          })),
        };
      });

      const totalStock = skus.reduce((sum, s) => sum + s.stock, 0);

      result = {
        found: true,
        outer_id: data.outerId || sku,
        stock: totalStock,
        skus,
        // 商品名/价格需通过 erp.item.list.query 补充
        name: null,
        price: null,
        cost: null,
        image_url: null,
        _source: 'warehouse',
      };
    }

    // 补充商品名/价格/图片：erp.item.list.query
    const itemData = await kuaimaiRequest('erp.item.list.query', {
      sysOuterId: sku,
      pageNo: 1,
      pageSize: 5,
    }, 'hmac');

    if (itemData.success) {
      const list = itemData.items || itemData.goodsList || itemData.list || [];
      if (list.length) {
        const g = list[0];
        const info = {
          name: g.name || g.goodsName || g.title || null,
          price: parseFloat(g.retailPrice || g.price || g.salePrice || 0) || null,
          cost: parseFloat(g.purchasePrice || g.costPrice || 0) || null,
          image_url: g.picUrl || g.mainPic || g.imgUrl || null,
          sys_item_id: String(g.sysItemId || g.id || ''),
        };
        if (result) {
          Object.assign(result, info);
        } else {
          // warehouse没找到，但item找到了
          result = {
            found: true,
            outer_id: sku,
            stock: parseInt(g.totalStock || g.stock || 0),
            skus: (g.skuList || g.skus || []).map(s => ({
              sku_outer_id: s.outerSkuId || s.skuOuterId || '',
              stock: s.stock || s.remainStock || 0,
              price: s.retailPrice || s.price || g.retailPrice || 0,
            })),
            _source: 'item_list',
            ...info,
          };
        }
      }
    }

    if (!result) {
      return res.json({ found: false, message: '快麦未找到该款号，请确认商家编码格式（如 S123-2604K4237）', raw: lastData });
    }

    res.json(result);
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
