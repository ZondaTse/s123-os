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

function kuaimaiSign(params) {
  const keys = Object.keys(params)
    .filter(k => k !== 'sign' && params[k] !== null && params[k] !== undefined && params[k] !== '')
    .sort();
  let base = '';
  for (const k of keys) base += k + params[k];
  return crypto.createHmac('sha256', KM_SECRET).update(base).digest('hex').toUpperCase();
}

function kuaimaiRequest(method, extraParams) {
  return new Promise((resolve, reject) => {
    const params = {
      method,
      appKey: KM_APPKEY,
      session: KM_SESSION,
      timestamp: nowStamp(),
      format: 'json',
      version: '1.0',
      sign_method: 'hmac-sha256',
      ...extraParams,
    };
    params.sign = kuaimaiSign(params);

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
// 根据款号查询快麦商品信息，支持模糊匹配（输入K4228可匹配S123-2603SK4228）
router.get('/goods', auth, async (req, res) => {
  const sku = (req.query.sku || '').trim();
  if (!sku) return res.status(400).json({ error: '请提供款号' });

  // 尝试多个查询策略
  const queries = [
    { outerId: sku },           // 精确主商家编码
    { goodsNo: sku },           // 精确款号
    { outerId: '%' + sku },     // 模糊：结尾匹配
    { goodsNo: '%' + sku },     // 模糊款号结尾
  ];

  try {
    let found = null;
    let lastData = null;

    for (const extraParams of queries) {
      const data = await kuaimaiRequest('erp.goods.list.query', {
        ...extraParams,
        pageNo: 1,
        pageSize: 10,
      });
      lastData = data;

      if (!data.success) {
        // 权限不足时直接返回错误，不继续尝试
        if (data.code === '27' || (data.msg || '').includes('权限')) {
          return res.status(403).json({
            error: '快麦商品接口权限不足，请在快麦开放平台申请 erp.goods.list.query 接口权限',
            code: data.code,
            tip: '申请地址：https://open.kuaima.cn → 开发者中心 → 您的APP → 申请接口'
          });
        }
        continue;
      }

      const list = data.goodsList || data.list || [];
      if (list.length) { found = list[0]; break; }
    }

    if (!found) {
      return res.json({ found: false, message: '快麦未找到该款号，请检查主商家编码是否正确', raw: lastData });
    }

    const result = {
      found: true,
      name: found.goodsName || found.title || found.name || sku,
      price: parseFloat(found.price || found.salePrice || found.retailPrice || 0),
      cost: parseFloat(found.costPrice || found.purchasePrice || 0),
      stock: parseInt(found.stock || found.totalStock || found.remainStock || 0),
      image_url: found.picUrl || found.mainPic || found.imgUrl || null,
      skus: (found.skuList || found.skus || []).map(s => ({
        sku_id: s.skuId || s.outerSkuId,
        properties: s.properties || s.specName || s.spec || '',
        stock: s.stock || s.remainStock || 0,
        price: s.price || found.price || 0,
      })),
      raw: found,
    };

    res.json(result);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

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
    const data = await kuaimaiRequest('erp.goods.list.query', {
      goodsNo: sku,
      pageNo: 1,
      pageSize: 10,
    });

    if (!data.success) {
      return res.status(400).json({ error: data.msg || '快麦查询失败' });
    }

    const list = data.goodsList || data.list || [];
    if (!list.length) return res.json({ found: false, message: '快麦未找到该款号' });

    const goods = list[0];
    const name = goods.goodsName || goods.title || sku;
    const price = parseFloat(goods.price || goods.salePrice || 0);
    const cost = parseFloat(goods.costPrice || goods.purchasePrice || 0);
    const stock = parseInt(goods.stock || goods.totalStock || 0);
    const image_url = goods.picUrl || goods.mainPic || null;

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
