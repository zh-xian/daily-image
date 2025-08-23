export default async function onRequest(context) {
  const { request } = context;
  const url = new URL(request.url);

  // 获取 format 参数，默认为 webp
  const format = url.searchParams.get("format") || "webp";
  // 是否直接返回二进制，默认 false（使用重定向）
  const direct = url.searchParams.get("direct") === "true";

  let imagePath;
  switch (format) {
    case "jpeg":
      imagePath = "/daily.jpeg";      // 压缩 JPEG
      break;
    case "original":
      imagePath = "/original.jpeg";   // 原始 JPEG
      break;
    case "webp":
    default:
      imagePath = "/daily.webp";      // 默认 WEBP
      break;
  }

  const imageUrl = new URL(imagePath, request.url);

  if (!direct) {
    // 🚀 默认重定向
    return Response.redirect(imagePath, 302);
  }

  // 🖼 direct=true → 返回图片二进制内容
  const resp = await fetch(imageUrl.toString());
  return new Response(await resp.arrayBuffer(), {
    headers: {
      "Content-Type": resp.headers.get("Content-Type") || "image/webp",
      "Cache-Control": "public, max-age=3600"
    },
  });
}
