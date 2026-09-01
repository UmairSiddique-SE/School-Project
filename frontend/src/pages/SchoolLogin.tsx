import { useState } from "react";
import { useNavigate } from "react-router-dom";

const schools = [
    {
        name: "Green Valley School",
        slug: "green-valley",
    },
    {
        name: "City School",
        slug: "city-school",
    },
];

export default function SchoolLogin() {
    const [search, setSearch] = useState("");
    const navigate = useNavigate();

    const result = schools.filter((s) =>
        s.name.toLowerCase().includes(search.toLowerCase())
    );

    return (
        <div className="min-h-screen flex items-center justify-center bg-[#030817]">
            <div className="w-full max-w-md p-6 rounded-2xl bg-white/10 border border-white/20">

                <h1 className="text-2xl font-bold text-white mb-5">
                    School Login
                </h1>

                <input
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    placeholder="Search School Name"
                    className="w-full px-4 py-3 rounded-xl bg-white/10 text-white border border-white/20"
                />

                <div className="mt-4 space-y-3">
                    {search && result.map((school) => (
                        <button
                            key={school.slug}
                            onClick={() =>
                                navigate(`/${school.slug}/login`)
                            }
                            className="w-full text-left p-3 rounded-xl bg-violet-600 text-white"
                        >
                            {school.name}
                        </button>
                    ))}
                </div>

            </div>
        </div>
    );
}