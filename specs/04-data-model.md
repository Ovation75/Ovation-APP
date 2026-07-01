# Data Model (draft — to be finalized with Supabase schema)

Entities (from dossier, not yet formalized as SQL):
- users (id, username, bio, avatar, visibility: public/private)
- follows (follower_id, followed_id, status: pending/approved)
- shows (id, title, genre, venue(s), synopsis, status: ongoing/touring/finished)
- logs (user_id, show_id, rating, review, created_at) — one per (user_id, show_id)
- playlists (id, user_id, name, emoji, visibility)
- playlist_items (playlist_id, show_id)
- wishlist_items (user_id, show_id) — always private
- notifications (user_id, type, ref_id, read_at)
- reports (reporter_id, target_type, target_id, reason, status)
- blocks (user_id, blocked_user_id)

Note: this is a draft for discussion, not a final schema. Final schema + RLS policies to be designed separately before any table is created in Supabase.
