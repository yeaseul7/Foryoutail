import PageFooter from "@/packages/ui/components/base/PageFooter";
import PageTemplate from "@/packages/ui/components/base/PageTemplate";
import ShelterPosts from "@/packages/ui/components/home/shelterList/ShelterPosts";

export default function AnimalShelter() {
    return (
        <div className="w-full min-h-screen font-sans bg-white">
            <main className="flex min-h-screen w-full flex-col items-center justify-between bg-white sm:items-start">
                <PageTemplate>
                    <div className="w-full">
                        <ShelterPosts />
                    </div>
                </PageTemplate>
                <PageFooter />
            </main>
        </div>
    );
}