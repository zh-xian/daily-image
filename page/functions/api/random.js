export default async function onRequest(context) {
  const { request, waitUntil } = context;
  const url = new URL(request.url);

  // 从当前请求的域名拼接 JSON 地址
  const host = url.origin;
  const jsonUrl = `${host}/picture/index.json`;

  const cache = caches.default;
  const cacheKey = new Request(jsonUrl, request);

  // --- 先尝试读取 JSON 缓存 ---
  let jsonResp = await cache.match(cacheKey);
  let images;

  if (jsonResp) {
    // 命中缓存
    jsonResp = new Response(await jsonResp.clone().arrayBuffer(), jsonResp);
    jsonResp.headers.set("bing-cache", "HIT");
    images = await jsonResp.json();
  } else {
    // 未命中缓存 → fetch
    const fetchResp = await fetch(new Request(jsonUrl, request));
    const data = await fetchResp.json();

    // 存入缓存（12 小时）
    const cacheable = new Response(JSON.stringify(data), fetchResp);
    cacheable.headers.set("Cache-Control", "public, max-age=43200");
    waitUntil(cache.put(cacheKey, cacheable.clone()));

    images = data;
    fetchResp.headers.set("bing-cache", "MISS");
  }

  // 去掉最后一张，防止过期
  if (images.length > 1) {
    images = images.slice(0, -1);
  }

  // 随机挑一张
  const randomImage = images[Math.floor(Math.random() * images.length)];
  const redirect = url.searchParams.get("redirect") === "true";

  const imagePath = randomImage.path; // e.g. /picture/2025-08-24.webp
  const imageUrl = new URL(imagePath, request.url);

  if (redirect) {
    // 🚀 302 跳转
    return Response.redirect(imagePath, 302);
  }

  // 🖼 直接返回图片二进制，走 EdgeOne 节点缓存
  const resp = await fetch(new Request(imageUrl.toString(), request));

  return new Response(resp.body, {
    headers: {
      "Content-Type": resp.headers.get("Content-Type") || "image/webp",
      "Cache-Control": "public, max-age=10800", // 浏览器缓存 3 小时
      "bing-cache": resp.headers.get("bing-cache") || "MISS-IMG",
    },
  });
}
