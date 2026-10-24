import jwt from "jsonwebtoken"

export const authenticate = async (req, res, next) => {
  try {
    const { authorization } = req.headers;

    const [scheme, token] = authorization?.split(" ") ?? [];

    if (scheme !== "Bearer" || !token) {
      return res.status(401).send({ message: "You aren't authorized" });
    }

    const decode = jwt.verify(token, process.env.accesstokenkey)

    req.user = decode;

    next()
  } catch (err) {
    return res.status(401).send({ message: err.message });
  }
};