import { test } from 'node:test';
import assert from 'node:assert/strict';
import { canonicalUrl, fingerprint, matchesPain, stripHtml } from '../lib/sources/util.ts';
import { parseFeed } from '../lib/sources/rss.ts';
import { parseRobots, isPathAllowed } from '../lib/http.ts';

test('tracking params and fragments do not create a new fingerprint', () => {
  const a = 'https://example.com/post/1?utm_source=x&ref=y#comments';
  const b = 'https://example.com/post/1';
  assert.equal(canonicalUrl(a), canonicalUrl(b));
  assert.equal(fingerprint('reddit', a), fingerprint('reddit', b));
});

test('a real query param is preserved', () => {
  assert.ok(canonicalUrl('https://example.com/p?id=7&utm_source=x').includes('id=7'));
});

test('the same url from two sources yields two fingerprints', () => {
  const url = 'https://example.com/p/1';
  assert.notEqual(fingerprint('reddit', url), fingerprint('indiehackers', url));
});

test('pain keyword matching is case insensitive', () => {
  assert.ok(matchesPain('I would PAY for a Template', ['template']));
  assert.ok(!matchesPain('just chatting about the weather', ['template', 'invoice']));
});

test('RSS 2.0 items are parsed, including CDATA', () => {
  const xml = `<rss><channel>
    <item><title><![CDATA[Contract: build dashboards]]></title>
      <link>https://example.com/jobs/1</link>
      <description>&lt;p&gt;Ongoing bespoke work&lt;/p&gt;</description></item>
    <item><title>Second</title><link>https://example.com/jobs/2</link></item>
  </channel></rss>`;

  const items = parseFeed(xml);
  assert.equal(items.length, 2);
  assert.equal(items[0]!.title, 'Contract: build dashboards');
  assert.equal(items[0]!.link, 'https://example.com/jobs/1');
  assert.equal(items[0]!.summary, 'Ongoing bespoke work');
});

test('Atom entries with href links are parsed', () => {
  const xml = `<feed><entry>
    <title>A post</title>
    <link rel="alternate" href="https://example.com/a"/>
    <summary>Some summary</summary>
  </entry></feed>`;

  const items = parseFeed(xml);
  assert.equal(items.length, 1);
  assert.equal(items[0]!.link, 'https://example.com/a');
});

test('items missing a title or link are skipped rather than half-parsed', () => {
  assert.equal(parseFeed('<rss><channel><item><title>No link</title></item></channel></rss>').length, 0);
});

test('html is stripped and entities decoded', () => {
  assert.equal(stripHtml('<b>Tom &amp; Jerry</b>&nbsp;win'), 'Tom & Jerry win');
});

test('escaped markup inside an RSS description is stripped, not surfaced as text', () => {
  assert.equal(stripHtml('&lt;p&gt;Ongoing bespoke work&lt;/p&gt;'), 'Ongoing bespoke work');
  assert.equal(stripHtml('&lt;div&gt;&lt;strong&gt;Rate&lt;/strong&gt; $80/hr&lt;/div&gt;'), 'Rate $80/hr');
});

test('a decoded less-than sign in prose does not swallow the sentence', () => {
  assert.equal(stripHtml('budget &lt; 5000 and team &gt; 3 people'), 'budget < 5000 and team > 3 people');
});

test('robots.txt disallow blocks a matching path', () => {
  const rules = parseRobots('User-agent: *\nDisallow: /private\n', 'SleepEngineMarketScan/0.1');
  assert.equal(isPathAllowed(rules, '/private/thing'), false);
  assert.equal(isPathAllowed(rules, '/public/thing'), true);
});

test('a more specific allow overrides a broader disallow', () => {
  const rules = parseRobots('User-agent: *\nDisallow: /r/\nAllow: /r/allowed/\n', 'SleepEngineMarketScan/0.1');
  assert.equal(isPathAllowed(rules, '/r/blocked'), false);
  assert.equal(isPathAllowed(rules, '/r/allowed/x'), true);
});

test('a block naming our agent overrides the wildcard block', () => {
  const rules = parseRobots(
    'User-agent: *\nDisallow: /\n\nUser-agent: SleepEngineMarketScan\nDisallow: /admin\n',
    'SleepEngineMarketScan/0.1',
  );
  assert.equal(isPathAllowed(rules, '/r/smallbusiness/top.json'), true);
  assert.equal(isPathAllowed(rules, '/admin/x'), false);
});

test('comments and blank lines are ignored', () => {
  const rules = parseRobots('# hello\nUser-agent: *\n\nDisallow: /x # trailing\n', 'SleepEngineMarketScan/0.1');
  assert.equal(isPathAllowed(rules, '/x/y'), false);
});
