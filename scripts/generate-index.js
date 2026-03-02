#!/usr/bin/env node
/**
 * generate-index.js
 * Netlifyビルド時に各コレクションフォルダのindex.jsonを自動生成する。
 * CMSでメニューを追加するだけでサイトに反映されるようにするための仕組み。
 *
 * _data/cocktails/*.json → _data/cocktails/index.json
 * _data/food/*.json      → _data/food/index.json
 * _data/news/*.json      → _data/news/index.json
 */
const fs   = require('fs');
const path = require('path');

const BASE = path.join(__dirname, '..', '_data');

['cocktails', 'food', 'news'].forEach(dir => {
  const folder = path.join(BASE, dir);
  if (!fs.existsSync(folder)) {
    console.log(`[generate-index] skipped: ${dir}/ not found`);
    return;
  }

  const files = fs.readdirSync(folder)
    .filter(f => f.endsWith('.json') && f !== 'index.json')
    .sort();

  const indexPath = path.join(folder, 'index.json');
  fs.writeFileSync(indexPath, JSON.stringify({ files }, null, 2) + '\n');
  console.log(`[generate-index] ${dir}/index.json: ${files.length} files`);
});

console.log('[generate-index] Done.');
