import PageFooter from "@/packages/ui/components/base/PageFooter";
import PageTemplate from "@/packages/ui/components/base/PageTemplate";
import ShelterPosts from "@/packages/ui/components/home/shelterList/ShelterPosts";

export default function AnimalShelter() {
    return (
        <div className="w-full min-h-screen font-sans bg-white">
            <main className="flex flex-col justify-between items-center w-full min-h-screen bg-whitesm:items-start">
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