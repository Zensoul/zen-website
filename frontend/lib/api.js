export async function signup({ name, email, password }) {
  const res = await fetch('https://w4zqabm0ii.execute-api.ap-south-1.amazonaws.com/dev/auth/signup', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ name, email, password }),
  });
  return res.json();
}

export async function login({ email, password }) {
  const res = await fetch('https://w4zqabm0ii.execute-api.ap-south-1.amazonaws.com/dev/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password }),
  });
  return res.json();
}
