import { redirect } from 'next/navigation';

/** Alias — login UI lives at `/`. */
export default function LoginPage() {
  redirect('/');
}
