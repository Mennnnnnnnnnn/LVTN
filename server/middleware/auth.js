import { clerkClient } from '@clerk/express';

// Middleware cho admin only
export const protectAdmin = async (req, res, next) => {
    try {
        const { userId } = req.auth();
        const user = await clerkClient.users.getUser(userId);

        if (user.privateMetadata?.role !== 'admin') {
            return res.json({ success: false, message: 'Access denied. Admins only.' });
        }

        next();
    } catch (error) {
        return res.json({ success: false, message: 'not authorized' });
    }
}

// Middleware cho user đăng nhập (bất kỳ user nào)
export const protectRoute = async (req, res, next) => {
    try {
        const { userId } = req.auth();

        if (!userId) {
            return res.json({ success: false, message: 'Vui lòng đăng nhập để tiếp tục' });
        }

        next();
    } catch (error) {
        return res.json({ success: false, message: 'not authorized' });
    }
}