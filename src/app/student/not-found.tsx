import { NotFoundState } from "@/components/error-pages";

export default function NotFound() {
  return (
    <div className="mx-auto w-full max-w-md py-10">
      <NotFoundState homeHref="/student" homeLabel="Panele dön" />
    </div>
  );
}
