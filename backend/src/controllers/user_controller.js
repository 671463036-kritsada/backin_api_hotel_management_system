// user.controller.js

const userService = require('../services/user_service')

exports.getUsers = async (req, res) => {
    try {
        const result = await userService.getUsers()
        res.status(200).json({ success: true, data: result })
    } catch (err) {
        console.error(err)
        res.status(500).json({ success: false, message: 'Server Error' })
    }
}
// exports.getMyProfile = async (req, res) => {
//     try {
//         const { id } = req.user  // มาจาก token ที่ authMiddleware decode ไว้
//         const result = await userService.getUserById(id)
//         res.status(200).json({ success: true, data: result })
//     } catch (err) {
//         console.error(err)
//         res.status(500).json({ success: false, message: 'Server Error' })
//     }
// }

exports.getMyProfile = async (req, res) => {
    try {
        const { id } = req.user  // มาจาก token ที่ authMiddleware decode ไว้
        const result = await userService.getUserById(id)
        if (!result) {
            return res.status(404).json({ success: false, message: 'ไม่พบผู้ใช้' })
        }
        res.status(200).json({ success: true, data: result })
    } catch (err) {
        console.error(err)
        res.status(500).json({ success: false, message: 'Server Error' })
    }
}

exports.getUsersNotAllowed = async (req, res) => {
    try {
        const result = await userService.getUsersNotAllowed()
        res.status(200).json({ success: true, data: result })
    } catch (err) {
        console.error(err)
        res.status(500).json({ success: false, message: 'Server Error' })
    }
}

exports.allowUser = async (req, res) => {
    try {
        const { id } = req.body
        if (!id) {
            return res.status(400).json({ success: false, message: 'id จำเป็นต้องระบุ' })
        }
        const result = await userService.allowUser(req.body)
        res.status(200).json(result)  
    } catch (err) {
        console.error(err)
        res.status(500).json({ success: false, message: 'Server Error' })
    }
}

exports.blockUser = async (req, res) => {
    try {
        const { id } = req.body
        if (!id) {
            return res.status(400).json({ success: false, message: 'id จำเป็นต้องระบุ' })
        }
        const result = await userService.blockUser(req.body)
        res.status(200).json(result) 
    } catch (err) {
        console.error(err)
        res.status(500).json({ success: false, message: 'Server Error' })
    }
}

exports.deleteUser = async (req, res) => {
    try {
        const { id } = req.params
        if (!id) {
            return res.status(400).json({ success: false, message: 'id จำเป็นต้องระบุ' })
        }
        const result = await userService.deleteUser(id)
        res.status(200).json({ success: true, data: result })
    } catch (err) {
        console.error(err)
        res.status(500).json({ success: false, message: 'Server Error' })
    }
}