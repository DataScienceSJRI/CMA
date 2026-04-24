import PageMeta from "../../components/common/PageMeta";
import AuthLayout from "./AuthPageLayout";
import SignInForm from "../../components/auth/SignInForm";

export default function SignIn() {
  return (
    <>
      <PageMeta
        title="SJRI Consultations | Sign In"
        description="This is the sign in page for the consultation management system of the Department of Biostatistics."
      />
      <AuthLayout>
        <SignInForm />
      </AuthLayout>
    </>
  );
}
