var qr = require("qr-image");

export default function handler(req: any, res: any) {
  var code = qr.image(decodeURI(req.query?.message), {
    type: "png",
    margin: 1,
    size: 10,
  });
  res.setHeader("Content-type", "image/png"); //sent qr image to client side
  code.pipe(res);
}
