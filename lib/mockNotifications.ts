// Mocked notifications for E10. Social activity + one editorial item.

export type NotificationType =
  | 'applause' // someone applauded (liked) your log
  | 'comment' // excluded from MVP feature-wise, but shown as a type here
  | 'follow' // new follower
  | 'follow_request' // follow request (private profile)
  | 'editorial'; // weekly Ovation recommendation

export type NotificationItem = {
  id: string;
  type: NotificationType;
  // Who/what triggered it (username for social, null for editorial).
  actorId: string | null;
  actorUsername: string | null;
  // Target to navigate to when tapped.
  target:
    | { screen: 'Profile'; userId: string; username: string }
    | { screen: 'ShowDetail'; showId: string; title: string };
  text: string;
  date: string; // pre-formatted
  read: boolean;
};

export const MOCK_NOTIFICATIONS: NotificationItem[] = [
  {
    id: 'n1',
    type: 'applause',
    actorId: 'u1',
    actorUsername: 'camille_p',
    target: { screen: 'ShowDetail', showId: 's5', title: 'Roméo et Juliette' },
    text: 'a applaudi ton avis sur Roméo et Juliette',
    date: "aujourd'hui",
    read: false,
  },
  {
    id: 'n2',
    type: 'follow',
    actorId: 'u3',
    actorUsername: 'sofia',
    target: { screen: 'Profile', userId: 'u3', username: 'sofia' },
    text: 'a commencé à te suivre',
    date: "aujourd'hui",
    read: false,
  },
  {
    id: 'n3',
    type: 'follow_request',
    actorId: 'u2',
    actorUsername: 'theo.m',
    target: { screen: 'Profile', userId: 'u2', username: 'theo.m' },
    text: 'souhaite te suivre',
    date: 'hier',
    read: false,
  },
  {
    id: 'n4',
    type: 'comment',
    actorId: 'u1',
    actorUsername: 'camille_p',
    target: { screen: 'ShowDetail', showId: 's1', title: 'Le Malade imaginaire' },
    text: 'a réagi à ton avis sur Le Malade imaginaire',
    date: 'hier',
    read: true,
  },
  {
    id: 'n5',
    type: 'editorial',
    actorId: null,
    actorUsername: null,
    target: { screen: 'ShowDetail', showId: 's7', title: 'Un stand-up presque parfait' },
    text: 'La reco de la semaine : Un stand-up presque parfait, à découvrir au Point Virgule.',
    date: 'il y a 3 j',
    read: true,
  },
];
