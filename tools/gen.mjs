// Generates the Aidou G9 fixture blog (cryptitalk.github.io) into the directory given as argv[2].
import { mkdirSync, writeFileSync } from 'node:fs';
import { join, dirname } from 'node:path';

const OUT = process.argv[2];
const BASE = 'https://cryptitalk.github.io';
const SITE = '林知远的技术笔记';
const NOTE = '本站为 Aidou 自动化测试固定数据，非真实个人博客。文中人物「林知远」为虚构角色。';
const LASTMOD = {
  '/': '2026-11-19',
  '/about/': '2026-11-18',
  '/posts/': '2026-11-19',
};

const posts = [
  {
    slug: 'latency-over-throughput',
    title: '为什么我总说延迟比吞吐更重要',
    date: '2026-11-15',
    summary: '做了八年后端，我越来越相信：用户感受到的是延迟，不是吞吐。',
    body: [
      '做了八年后端开发，我在不同团队里反复遇到同一个争论：到底该优先优化吞吐，还是优先优化延迟。我的答案一直没变。',
      '我常说：“用户不会看你的 QPS 曲线，他们只会感觉这个按钮慢不慢。”吞吐决定你要买多少台机器，延迟决定用户愿不愿意留下来。',
      '去年我们把一个语音接口的 P99 从八百毫秒压到了两百毫秒，机器数量几乎没变，但留存明显上升。那次之后我更确定了：“先把尾延迟管住，再谈扩容。”',
      '具体做法其实不神秘：减少跨机房调用，把同步日志改成异步批量写，给每个下游设置明确的超时。我跟新同事讲：“没有超时的调用，迟早会变成事故。”',
    ],
  },
  {
    slug: 'rust-first-year',
    title: '用 Rust 写服务的第一年',
    date: '2026-10-28',
    summary: '从 Go 迁到 Rust 的一年里，我踩过的坑和真正得到的好处。',
    body: [
      '团队从 Go 迁到 Rust 已经满一年了。很多人问我值不值得，我的回答是：值得，但不是因为性能。',
      '我常说：“Rust 最大的价值是让你在写代码的时候就把并发问题想清楚。”编译器会逼着你回答谁拥有这块数据、谁能修改它，这些问题在 Go 里往往要等到线上才暴露。',
      '当然代价也很真实。头三个月大家的开发速度掉了一半，生命周期报错让不少人怀疑人生。我当时在周会上说：“慢下来是正常的，我们在还以前欠下的债。”',
      '一年下来，线上因为数据竞争导致的故障是零。我的结论是：“选语言就是选你愿意在哪个阶段付出代价。”',
    ],
  },
  {
    slug: 'weekend-running',
    title: '周末跑步和写代码的共同点',
    date: '2026-10-12',
    summary: '坚持跑步三年，我发现它和长期维护一个系统很像。',
    body: [
      '三年前我开始每个周末跑步，最开始五公里都跑不下来，现在半程马拉松已经是常规项目。',
      '我常说：“跑步和维护系统一样，靠的不是某一天的爆发，而是每周稳定地出现。”配速不重要，重要的是别断。',
      '跑步也让我学会了看指标。心率、步频、配速，和监控面板上的延迟、错误率、饱和度一样，都是在告诉你身体或系统哪里快撑不住了。',
      '有朋友问我跑步时想什么，我说：“什么都不想，这是我一周里唯一不看告警的一个小时。”周末偶尔也会去爬山，换一种方式放空。',
    ],
  },
  {
    slug: 'code-review-habits',
    title: '我做代码评审的三个习惯',
    date: '2026-09-30',
    summary: '代码评审不是挑错，而是让两个人对同一段代码有相同的理解。',
    body: [
      '带团队以后，我每天花在代码评审上的时间比写代码还多。慢慢地我形成了三个习惯。',
      '第一，先看测试再看实现。我常说：“测试写清楚了，实现基本就不会跑偏。”测试是作者对需求的理解，最值得先对齐。',
      '第二，只提能说出理由的意见。如果我说不清为什么要改，那就只是个人口味，我会标成可选。我跟团队约定：“评论里没有理由的意见，作者可以直接忽略。”',
      '第三，大改动先聊再写。一个上千行的合并请求，评审几乎不可能做好。我更愿意说：“先花十分钟画个图，比事后改两天要划算。”',
    ],
  },
];

const css = `
:root { color-scheme: light dark; }
body { margin: 0 auto; max-width: 720px; padding: 24px 16px; font: 16px/1.75 system-ui, -apple-system, "PingFang SC", "Microsoft YaHei", sans-serif; background: #fdfdfb; color: #222; }
@media (prefers-color-scheme: dark) { body { background: #1b1b1d; color: #e6e6e6; } a { color: #8ab4f8; } }
header nav a { margin-right: 12px; }
.fixture-note { border: 1px dashed #c33; padding: 8px 12px; font-size: 14px; color: #c33; }
footer { margin-top: 40px; font-size: 13px; opacity: .7; }
`;

const nav = `<header><p><strong>${SITE}</strong></p><nav><a href="/">首页</a><a href="/posts/">文章</a><a href="/about/">关于我</a><a href="/feed.xml">RSS</a></nav></header>`;
const note = `<p class="fixture-note">${NOTE}</p>`;

function page({ title, desc, body, feedLink = false }) {
  return `<!doctype html>
<html lang="zh-CN">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${title}</title>
<meta name="description" content="${desc}">
<meta name="robots" content="noindex">
${feedLink ? `<link rel="alternate" type="application/rss+xml" title="${SITE}" href="${BASE}/feed.xml">\n` : ''}<style>${css}</style>
</head>
<body>
${nav}
${note}
<main>
${body}
</main>
<footer><p>${NOTE}</p></footer>
</body>
</html>
`;
}

function write(rel, content) {
  const p = join(OUT, rel);
  mkdirSync(dirname(p), { recursive: true });
  writeFileSync(p, content);
}

const postList = posts
  .map((p) => `<li><a href="/posts/${p.slug}/">${p.title}</a>（${p.date}）<br>${p.summary}</li>`)
  .join('\n');

write('index.html', page({
  title: SITE,
  desc: '林知远（虚构）的个人技术博客：后端开发、Rust、延迟优化、跑步。Aidou 测试固定数据。',
  feedLink: true,
  body: `<article>
<h1>你好，我是林知远</h1>
<p>这里是我的个人技术博客。我做了八年后端开发，主要写 Rust 和 Go，关心的是延迟、稳定性和团队协作。我常说：“好的系统是无聊的系统，半夜不响告警就是最大的成就。”</p>
<p>这个博客记录我在工作里踩过的坑、读过的书，以及周末跑步时想明白的事情。更新不算勤快，但每一篇都是自己真实想过的东西。</p>
<h2>最近的文章</h2>
<ul>
${postList}
</ul>
</article>`,
}));

write('about/index.html', page({
  title: `关于我 - ${SITE}`,
  desc: '关于林知远（虚构人物）：后端工程师，Rust 爱好者，周末跑者。',
  body: `<article>
<h1>关于我</h1>
<p>我叫林知远（虚构人物），是一名后端工程师，做了八年服务端开发。早年写 Java，后来转到 Go，最近一年主要在用 Rust 重写团队的核心服务。</p>
<p>我最在意的是延迟和稳定性。我经常跟同事说：“能用一台机器解决的问题，就别急着上分布式。”我也相信：“文档写得好，比多开三次会都有用。”</p>
<p>工作之外，我每个周末都会跑步，偶尔去爬山。我觉得：“长期主义不是口号，是每周都按时出现。”</p>
<p>如果你也在做实时系统、语音或者低延迟服务，欢迎交流。这个页面和整个站点都是 Aidou 自动化测试用的固定数据。</p>
</article>`,
}));

write('posts/index.html', page({
  title: `文章 - ${SITE}`,
  desc: '林知远（虚构）的全部文章列表，可通过 RSS 订阅。',
  feedLink: true,
  body: `<article>
<h1>全部文章</h1>
<p>这里列出我写过的所有文章，主要关于后端开发、Rust、延迟优化和跑步。你也可以通过 <a href="/feed.xml">RSS</a> 订阅更新。我常说：“写下来的东西，才算真正想清楚了。”</p>
<ul>
${postList}
</ul>
</article>`,
}));

for (const p of posts) {
  write(`posts/${p.slug}/index.html`, page({
    title: `${p.title} - ${SITE}`,
    desc: p.summary,
    body: `<article>
<h1>${p.title}</h1>
<p><time datetime="${p.date}">${p.date}</time> · 林知远</p>
${p.body.map((t) => `<p>${t}</p>`).join('\n')}
</article>`,
  }));
}

const urls = [
  ['/', LASTMOD['/']],
  ['/about/', LASTMOD['/about/']],
  ['/posts/', LASTMOD['/posts/']],
  ...posts.map((p) => [`/posts/${p.slug}/`, p.date]),
];
write('sitemap.xml', `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls.map(([u, d]) => `  <url><loc>${BASE}${u}</loc><lastmod>${d}</lastmod></url>`).join('\n')}
</urlset>
`);

write('robots.txt', `User-agent: *
Allow: /

Sitemap: ${BASE}/sitemap.xml
`);

const rfc822 = (d) => new Date(`${d}T08:00:00Z`).toUTCString();
const esc = (s) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
write('feed.xml', `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0">
<channel>
  <title>${SITE}</title>
  <link>${BASE}/</link>
  <description>${esc(NOTE)}</description>
  <language>zh-CN</language>
${posts.map((p) => `  <item>
    <title>${esc(p.title)}</title>
    <link>${BASE}/posts/${p.slug}/</link>
    <guid>${BASE}/posts/${p.slug}/</guid>
    <pubDate>${rfc822(p.date)}</pubDate>
    <description>${esc(p.body.join(' '))}</description>
  </item>`).join('\n')}
</channel>
</rss>
`);

write('.nojekyll', '');
write('README.md', `# cryptitalk.github.io

Aidou 自动化测试固定数据（aidou-voice-e2e G9 T23 / T23b）。非真实个人博客，人物「林知远」为虚构。

Static fixture blog used by the aidou-voice-e2e G9 suite to test the AI-twin website crawler
(sitemap crawl from the site root, RSS / single-page path for a sub-path seed). Please keep the
page set stable: T23 expects the root crawl to read >= 2 pages via sitemap.xml, T23b expects the
\`/posts/\` seed to read exactly 1 (RSS via feed.xml).

Pages are generated; no tracking, no external scripts.
`);
console.log(`wrote ${urls.length} pages + sitemap/robots/feed to ${OUT}`);
