import { getServerSession } from 'next-auth/next';
import { authOptions } from '../api/auth/[...nextauth]/route';
import TodoList from './components/TodoList';
import { redirect } from 'next/navigation';

export default async function TodosPage() {
  const session = await getServerSession(authOptions);

  if (!session || session.user.role !== 'admin') {
    return (
      <div className="container mx-auto p-4">
        <div className="mt-10 text-2xl font-semibold">Access Denied</div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold my-6">Todos</h1>
      <TodoList />
    </div>
  );
}
