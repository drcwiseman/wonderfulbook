import { useQuery } from "@tanstack/react-query";
import { Rocket, Heart, TrendingUp, Brain, Users, Activity } from "lucide-react";
import type { Book } from "@shared/schema";

const categoryIcons = {
  'personal-development': Rocket,
  'spirituality': Heart,
  'business': TrendingUp,
  'health': Activity,
  'relationships': Users,
  'psychology': Brain,
};

export default function CategoriesSection() {
  const categories = [
    { id: 'personal-development', name: 'Personal Development' },
    { id: 'spirituality', name: 'Spirituality & Mindfulness' },
    { id: 'business', name: 'Business & Finance' },
    { id: 'health', name: 'Health & Wellness' },
    { id: 'relationships', name: 'Relationships' },
    { id: 'psychology', name: 'Psychology' },
  ];

  const CategoryRow = ({ category }: { category: { id: string; name: string } }) => {
    const { data: books } = useQuery<Book[]>({
      queryKey: [`/api/books?category=${category.id}`],
    });

    const IconComponent = categoryIcons[category.id as keyof typeof categoryIcons] || Rocket;

    return (
      <div className="mb-12">
        <h3 className="text-xl font-semibold mb-4 flex items-center">
          <IconComponent className="h-5 w-5 text-netflix-red mr-3" />
          {category.name}
        </h3>
        <div className="flex space-x-4 overflow-x-auto scrollbar-hide pb-4">
          {books?.slice(0, 8).map((book) => (
            <div key={book.id} className="flex-none w-32 md:w-40">
              <div 
                className="group cursor-pointer"
                onClick={() => window.location.href = `/book/${book.id}`}
              >
                <img
                  src={book.coverImageUrl || "https://images.unsplash.com/photo-1544947950-fa07a98d237f?ixlib=rb-4.0.3&auto=format&fit=crop&w=300&h=400"}
                  alt={book.title}
                  className="w-full h-48 md:h-60 object-cover rounded-lg shadow-lg group-hover:shadow-xl transition-all duration-300"
                />
                <div className="mt-2">
                  <h4 className="text-sm font-medium truncate">{book.title}</h4>
                  <p className="text-xs text-gray-400 truncate">{book.author}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  };

  return (
    <section id="categories" className="py-16 px-4 md:px-8 bg-netflix-gray/50">
      <div className="max-w-7xl mx-auto">
        <h2 className="text-3xl md:text-4xl font-bold mb-8">Browse by Category</h2>
        
        {categories.map((category) => (
          <CategoryRow key={category.id} category={category} />
        ))}
      </div>
      

    </section>
  );
}
