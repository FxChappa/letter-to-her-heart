import type {
  Database as GeneratedDatabase,
  Json as GeneratedJson,
  Tables,
} from './database.generated.types';

export type Database = GeneratedDatabase;
export type Json = GeneratedJson;

export type ProfileRole = 'aldane' | 'santana';
export type AvatarKey = 'aldane' | 'santana';
export type MessageType = 'text' | 'letter' | 'system';
export type RelationshipMomentType = 'girlfriend_question';
export type RelationshipResponse = 'yes';

export type ProfileRow = Tables<'profiles'>;
export type Profile = Omit<ProfileRow, 'role' | 'avatar_key'> & {
  role: ProfileRole;
  avatar_key: AvatarKey;
};

export type MessageRow = Tables<'messages'>;
export type Message = Omit<MessageRow, 'message_type'> & {
  message_type: MessageType;
};

export type LetterRecord = Tables<'letters'>;

export type RelationshipMomentRow = Tables<'relationship_moments'>;
export type RelationshipMoment = Omit<RelationshipMomentRow, 'moment_type' | 'response'> & {
  moment_type: RelationshipMomentType;
  response: RelationshipResponse | null;
};
