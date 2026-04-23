export default function handler(req, res) {
     res.status(410).json({ error: 'Gone. Admin moved to /admin.html (Supabase auth required).' });
   }
