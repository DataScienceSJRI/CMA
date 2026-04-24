import PageBreadcrumb from "../components/common/PageBreadCrumb";
import UserMetaCard from "../components/UserProfile/UserMetaCard";
import UserInfoCard from "../components/UserProfile/UserInfoCard";
import PageMeta from "../components/common/PageMeta";

export default function UserProfiles() {
  return (
    <>
      <PageMeta
        title="SJRI Consultations | Profile"
        description="View your profile information."
      />
      <PageBreadcrumb pageTitle="Profile" />
      <div className="space-y-6">
        <UserMetaCard />
        <UserInfoCard />
      </div>
    </>
  );
}
