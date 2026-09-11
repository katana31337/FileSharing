import { useParams } from 'react-router-dom';

export default function ShareView() {
  const { shortUrl } = useParams<{ shortUrl: string }>();

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-2xl mx-auto bg-white p-8 rounded-lg shadow-md">
        <h1 className="text-2xl font-bold mb-6">Просмотр файла</h1>
        <p className="text-gray-600">Короткая ссылка: {shortUrl}</p>
        <p className="text-sm text-gray-500 mt-4">
          Здесь будет отображаться информация о файле и кнопка для скачивания.
        </p>
      </div>
    </div>
  );
}
