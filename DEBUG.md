// login flow guard
async function getSession(request: FastifyRequest): Promise<AuthenticatedSession | null> {
const auth = getAuthConfig();
const token = request.cookies?.[auth.cookieName];
if (!token) return null;

const session = await orm.em.findOne(
AuthSession,
{
tokenHash: hashToken(token),
revokedAt: null,
expiresAt: { $gt: new Date() },
},
{ populate: ["user", "user.person", "user.organization"] },
);

if (!session?.user) return null;
if (isKeyRefreshRequired(session.user)) return null;

return session as AuthenticatedSession;
}

// after successful WebAuthn registration / re-enroll
const lock = await tx.findOne(User, { id: user.id }, { lockMode: LockMode.PESSIMISTIC_WRITE });
lock.nextKeyRefreshAt = nextRefreshAt();
