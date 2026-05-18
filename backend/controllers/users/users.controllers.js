const Users = require("../../models/users.models");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

const dotenv = require("dotenv");

dotenv.config({ path: "./.env" });

exports.register = async (req, res) => {
  try {
    let saltRounds = 10;

    const {
      hiringDate,
      mobile,
      name,
      password,
      qualification,
      salary,
      username,
      role,
    } = req.body;

    const userExist = await Users.findOne({ where: { username: username } });

    if (userExist) {
      return res
        .status(409)
        .json({ statusCode: "409", Message: "اسم المسنخدم موجود بالفعل" });
    }

    const hashedPassword = await bcrypt.hash(password, saltRounds);

    const user = await Users.create({
      name: name,
      username: username,
      role: role,
      password: hashedPassword,
      phone: mobile,
      salary: salary,
      qualification: qualification,
      hiringDate: hiringDate,
    });

    if (!user) {
      throw new Error("something went wrong while adding user");
    }

    return res
      .status(200)
      .json({ statusCode: "200", Message: "تمت الإضافة بنجاح" });
  } catch (e) {
    console.error(e);
    res
      .status(500)
      .json({ statusCode: "500", Message: "حدث خطأ ما حاول مرة أخرى" });
  }
};

exports.users = async (req, res) => {
  try {
    const users = await Users.findAll({
      attributes: { exclude: ["password"] },
      order: [["status", "ASC"]],
    });

    res.json({ users });
  } catch (e) {
    console.error(e);
    res
      .status(500)
      .json({ statusCode: "500", Message: "حدث خطأ ما حاول مرة أخرى" });
  }
};

exports.isAuthed = async (req, res) => {
  try {
    console.log(req.cookies);

    const { authToken } = req.cookies;

    const valid = jwt.verify(
      authToken,
      process.env.JWT_SECRET || "cardiosecretkey",
    );

    if (valid) {
      const decoded = jwt.decode(
        authToken,
        process.env.JWT_SECRET || "cardiosecretkey",
      );

      return res.json({
        decoded,
        isAuthenticated: true,
      });
    }

    return res
      .status(401)
      .json({ statusCode: "401", Message: "Not authorized" });
  } catch (e) {
    console.error(e);
    res
      .status(500)
      .json({ statusCode: "500", Message: "حدث خطأ ما حاول مرة أخرى" });
  }
};

exports.login = async (req, res) => {
  try {
    const { username, password } = req.body;

    const userExist = await Users.findOne({ where: { username: username } });

    if (!userExist) {
      return res
        .status(404)
        .json({ statusCode: "404", Message: "إسم المستخدم غير موجود" });
    }

    const valid = await bcrypt.compare(password, userExist.password);

    if (!valid) {
      return res
        .status(401)
        .json({ statusCode: "401", Message: "كلمة مرور خاطئة" });
    }

    const token = jwt.sign(
      { id: userExist.id, role: userExist.role },
      process.env.JWT_SECRET || "cardiosecretkey",
    );

    res.cookie("authToken", token, {
      httpOnly: true,
      secure: false,
      sameSite: "Lax",
    });

    return res.status(200).json({
      statusCode: "200",
      Message: "تم تسجيل الدخول",
      userInfo: {
        name: userExist.username,
        role: userExist.role,
        id: userExist.id,
      },
    });
  } catch (e) {
    console.error(e);
    res
      .status(500)
      .json({ statusCode: "500", Message: "حدث خطأ ما حاول مرة أخرى" });
  }
};

exports.logout = async (req, res) => {
  try {
    res.clearCookie("authToken", {
      httpOnly: true,
      secure: false,
      sameSite: "Lax",
    });

    return res.status(200).json({ message: "Logged out successfully" });
  } catch (e) {
    console.error(e);
    res
      .status(500)
      .json({ statusCode: "500", Message: "حدث خطأ ما حاول مرة أخرى" });
  }
};

exports.suspendUser = async (req, res) => {
  try {
    console.log(req.body);

    console.log(req.body);

    const { userID } = req.body;

    const user = await Users.findOne({ where: { id: userID } });

    if (user.status == "active") {
      const [result] = await Users.update(
        { status: "suspended" },
        { where: { id: userID } },
      );

      if (result === 0) {
        throw new Error("Error while deleting user");
      }

      return res
        .status(200)
        .json({ statusCode: "200", Message: "تم إيقاف المستخدم" });
    }

    const [result] = await Users.update(
      { status: "active" },
      { where: { id: userID } },
    );

    if (result === 0) {
      throw new Error("Error while deleting user");
    }

    return res
      .status(200)
      .json({ statusCode: "200", Message: "تم إعادة تفعيل المستخدم" });
  } catch (e) {
    console.error(e);
    res
      .status(500)
      .json({ statusCode: "500", Message: "حدث خطأ ما حاول مرة أخرى" });
  }
};

exports.updateUser = async (req, res) => {
  try {
    console.log(req.body);
    let saltRounds = 10;

    const {
      id,
      hiringDate,
      mobile,
      name,
      password,
      qualification,
      salary,
      username,
      role,
    } = req.body;

    const userExist = await Users.findOne({ where: { username: username } });

    if (userExist) {
      return res
        .status(409)
        .json({ statusCode: "409", Message: "اسم المسنخدم موجود بالفعل" });
    }

    const hashedPassword = await bcrypt.hash(password, saltRounds);

    const user = await Users.update(
      {
        name: name,
        username: username,
        role: role,
        password: hashedPassword,
        phone: mobile,
        salary: salary,
        qualification: qualification,
        hiringDate: hiringDate,
      },
      { where: { id: id } },
    );

    if (!user) {
      throw new Error("something went wrong while adding user");
    }

    return res
      .status(200)
      .json({ statusCode: "200", Message: "تمت التحديث بنجاح" });
  } catch (e) {
    console.error(e);
    res
      .status(500)
      .json({ statusCode: "500", Message: "حدث خطأ ما حاول مرة أخرى" });
  }
};
