import jwt from "jsonwebtoken";
export const accesstoken = (user) => {
  return jwt.sign(
    {
      _id: user._id,
      name: user.name,
      role: user.role,
    },
    process.env.accesstokenkey,
    {
      expiresIn: "1m", // fixed casing
    }
  );
};

export const refreshtoken = (user) => {
  return jwt.sign(
    {
      _id: user._id,
      name: user.name,
      role: user.role,
    },
    process.env.refreshtokenkey,
    {
      expiresIn: "15d", // fixed casing
    }
  );
};