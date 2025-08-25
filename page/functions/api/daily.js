export default async function onRequest(context) {
  const { request } = context;
  const url = new URL(request.url);

  const format = url.searchParams.get("format") || "webp";
  const redirect = url.searchParams.get("redirect") === "true"; // 👈 默认 direct
  let imagePath;

  switch (format) {
    case "jpeg":
      imagePath = "/daily.jpeg";
      break;
    case "original":
      imagePath = "/original.jpeg";
      break;
    case "webp":
    default:
      imagePath = "/daily.webp";
      break;
  }

  const imageUrl = new URL(imagePath, request.url);

  if (redirect) {
    // 🚀 如果显式指定 redirect=true → 302 跳转
    return Response.redirect(imagePath, 302);
  }

  const cache = caches.default;
  const cacheKey = new Request(request.url, request);

  // --- 尝试命中缓存 ---
  let response = await cache.match(cacheKey);
  if (response) {
    response = new Response(response.body, response);
    response.headers.set("bing-cache", "HIT");
    response.headers.set("Cache-Control", "public, max-age=10800"); // 浏览器缓存 3 小时
    return response;
  }

  // --- 未命中缓存 → 回源 ---
  response = await fetch(new Request(imageUrl.toString(), request));

  // 克隆一份存入边缘缓存（不阻塞响应）
  context.waitUntil(cache.put(cacheKey, response.clone()));

  // 返回响应（未命中 → MISS）
  const finalResp = new Response(response.body, response);
  finalResp.headers.set("bing-cache", "MISS");
  finalResp.headers.set("Cache-Control", "public, max-age=10800"); // 浏览器缓存 3 小时

  return finalResp;
}