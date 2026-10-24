import { user } from "./employee.model.js";

const createuser = async (data) => {
  return await user.create(data);
};

const findByEmail = async (email) => {
  return await user.findOne({ email });
};

const findById = async (id) => {
  return await user.findById(id).select("-password");
};

export default {
  createuser,
  findByEmail,
  findById,
};