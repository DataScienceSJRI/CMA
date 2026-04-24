import PageMeta from "../../components/common/PageMeta";
import AuthLayout from "./AuthPageLayout";
import SignUpForm from "../../components/auth/SignUpForm";

export default function SignUp() {
  return (
    <>
      <PageMeta
        title="SJRI Consultations | Sign Up"
        description="SJRI Consultations - internal portal for the Department of Biostatistics."
      />
      <AuthLayout>
        <SignUpForm />
      </AuthLayout>
    </>
  );
}
