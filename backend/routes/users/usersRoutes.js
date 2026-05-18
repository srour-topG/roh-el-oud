const {Router} = require("express")

const router = Router()

const {register, users,login, isAuthed, logout,suspendUser,updateUser} = require("../../controllers/users/users.controllers")


router.post("/api/auth/register", register)
router.post("/api/auth/login", login)
router.post("/api/auth/logout", logout)

router.delete("/api/auth/userSupend", suspendUser)
router.patch("/api/userUpdate", updateUser)



router.get("/api/isAuthed", isAuthed)

router.get("/api/users", users )
module.exports = router