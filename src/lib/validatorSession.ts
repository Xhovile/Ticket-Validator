import type { User } from '../types';
import type { ValidatorMeResponse } from './buymeshoApi';
import type { ValidatorEventRecord } from './validatorMappers';
import { mapValidatorEvent } from './validatorMappers';

export type ValidatorSessionSnapshot = {
  user: User;
  events: ReturnType<typeof mapValidatorEvent>[];
  authorizedEventIds: string[];
  isOrganizer: boolean;
};

function getCreatorAvatarUrl(creator: Record<string, unknown> | null | undefined): string | undefined {
  if (!creator) return undefined;

  // Match BuyMesho Header's getAvatarUrl() priority:
  // profile_picture → business_logo → Firebase photoURL.
  const candidates = [
    creator.profile_picture,
    creator.business_logo,
    creator.photoURL,
    creator.photo_url,
  ];

  const avatar = candidates.find((value) => typeof value === 'string' && value.trim().length > 0);
  return typeof avatar === 'string' ? avatar : undefined;
}

export function buildValidatorSession(
  response: ValidatorMeResponse,
): ValidatorSessionSnapshot {
  const identity = response.identity;
  const accessScope = response.access_scope;

  const authorizedEventIds =
    accessScope.allowed_event_ids?.length
      ? accessScope.allowed_event_ids
      : response.events.map((event) => event.id);

  const isOrganizer =
    Boolean(response.creator) ||
    accessScope.role === 'admin' ||
    Boolean(accessScope.is_admin) ||
    Boolean(identity.is_admin);

  const user: User = {
    id: identity.uid,
    name: identity.display_name || identity.email || 'BuyMesho User',
    email: identity.email || '',
    role: isOrganizer ? 'organizer' : 'gate_staff',
    avatarUrl: getCreatorAvatarUrl(response.creator),
    assignedEventIds: authorizedEventIds,
    assignedGate: undefined,
  };

  const events = response.events
    .map((event: ValidatorEventRecord) => mapValidatorEvent(event))
    .filter((event) => authorizedEventIds.includes(event.id));

  return {
    user,
    events,
    authorizedEventIds,
    isOrganizer,
  };
}
