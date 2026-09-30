import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Container } from "@/components/layout/container";

export default function NotFound() {
  return (
    <Container className="py-24 text-center">
      <p className="text-brand text-sm font-semibold">404</p>
      <h1 className="mt-2 text-3xl font-bold">이 페이지는 없어요</h1>
      <p className="text-muted-foreground mt-3">
        주소가 바뀌었거나 아직 만들어지지 않은 페이지예요.
      </p>
      <Button className="mt-8" render={<Link href="/" />}>
        홈으로
      </Button>
    </Container>
  );
}
