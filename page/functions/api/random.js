import images from "../picture/index.json" assert { type: "json" };

export default async function onRequest(context) {
  const { request } = context;
  const url = new URL(request.url);

  // 随机挑选
  const randomImage = images[Math.floor(Math.random() * images.length)];

  // 判断 query 参数（?direct=true 时直接返回图片内容）
  const direct = url.searchParams.get("direct") === "true";

  // 图片路径
  const imagePath = `/picture/${randomImage.filename}`;
  const imageUrl = new URL(imagePath, request.url);

  if (!direct) {
    // 🚀 默认：重定向到图片（更快，走 CDN 缓存）
    return Response.redirect(imagePath, 302);
  }

  // 🖼 如果 direct=true：直接返回图片二进制内容
  const resp = await fetch(imageUrl.toString());
  return new Response(await resp.arrayBuffer(), {
    headers: {
      "Content-Type": resp.headers.get("Content-Type") || "image/webp",
      "Cache-Control": "public, max-age=3600"
    },
  });
}
