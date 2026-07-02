// Profile completion model — shared by the MyProfile completion card and the
// post-login completion prompt (Feed). Keeps the "what counts as complete"
// rule in one place so both surfaces agree.
//
// NOTE on the avatar item: there is no avatar upload pipeline yet (no avatar
// column, EditProfile's "Changer la photo" is a placeholder). So the avatar
// item is flagged `coming` and is EXCLUDED from the percentage — otherwise the
// bar could never reach 100%. It still surfaces as a suggestion so the intent
// (bio, avatar, preferences) is visible.

export type CompletionTarget = 'EditProfile' | 'Preferences';

export type CompletionItem = {
  key: 'bio' | 'preferences' | 'avatar';
  label: string;
  done: boolean;
  coming?: boolean; // not achievable in-app yet; excluded from percent
  target: CompletionTarget;
};

export type ProfileCompletion = {
  percent: number; // over the achievable (non-coming) items
  items: CompletionItem[];
  todo: CompletionItem[]; // items still worth showing (not done)
  complete: boolean; // all achievable items done
};

export function computeProfileCompletion(input: {
  bio: string | null | undefined;
  preferredGenresCount: number;
}): ProfileCompletion {
  const items: CompletionItem[] = [
    {
      key: 'bio',
      label: 'Ajouter une bio',
      done: !!input.bio?.trim(),
      target: 'EditProfile',
    },
    {
      key: 'preferences',
      label: 'Choisir tes genres préférés',
      done: input.preferredGenresCount > 0,
      target: 'Preferences',
    },
    {
      key: 'avatar',
      label: 'Ajouter une photo de profil',
      done: false,
      coming: true,
      target: 'EditProfile',
    },
  ];

  const achievable = items.filter((i) => !i.coming);
  const doneCount = achievable.filter((i) => i.done).length;
  const percent = Math.round((doneCount / achievable.length) * 100);
  const todo = items.filter((i) => !i.done);
  return { percent, items, todo, complete: percent === 100 };
}
