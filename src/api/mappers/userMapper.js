import { validate } from '../schemas/utils';
import { UserSchema, UserCreateSchema, UserUpdateSchema } from '../schemas';

// Normalize strings like role/status to lowercase
const normalizeUser = (u) => ({
  ...u,
  role: (u.role || '').toLowerCase(),
  status: (u.status || '').toLowerCase(),
});

export function userApiToModel(raw) {
  const data = validate(UserSchema, normalizeUser(raw), 'User');
  return data;
}

export function usersApiToModel(list = []) {
  return list.map(userApiToModel);
}

// For creating users: validate the payload we send to API
export function userModelToCreatePayload(model) {
  const payload = validate(
    UserCreateSchema,
    {
      name: model.name,
      email: model.email,
      role: (model.role || 'staff').toLowerCase(),
      phone: model.phone || undefined,
      password: model.password || undefined,
    },
    'UserCreate'
  );
  return payload;
}

// For updates: only send allowed fields
export function userModelToUpdatePayload(model) {
  const update = {};
  if (model.name !== undefined) update.name = model.name;
  if (model.email !== undefined) update.email = model.email;
  if (model.phone !== undefined) update.phone = model.phone;
  if (model.role !== undefined) update.role = (model.role || '').toLowerCase();
  if (model.status !== undefined)
    update.status = (model.status || '').toLowerCase();
  if (model.password) update.password = model.password;
  return validate(UserUpdateSchema, update, 'UserUpdate');
}
