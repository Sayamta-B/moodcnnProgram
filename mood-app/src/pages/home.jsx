import SidebarRight from "../components/sidebar-right";
import PostCard from "../components/postcard";

const posts = [
  { id: 1, username: "Alex", userPhoto: "https://i.pravatar.cc/100?img=1", image: "https://picsum.photos/400/300?random=1" },
  { id: 2, username: "Zez", userPhoto: "https://i.pravatar.cc/100?img=2", image: "https://picsum.photos/400/300?random=2" },
  { id: 3, username: "Roy", userPhoto: "https://i.pravatar.cc/100?img=3", image: "https://picsum.photos/400/300?random=3" },
];

function Home() {
  const user = JSON.parse(localStorage.getItem("user"));

  return (
    <>
      <div className="flex h-screen">
        <main className="flex-1 overflow-y-auto p-5 space-y-5">
          {posts.map((post) => (
            <PostCard key={post.id} post={post} />
          ))}
        </main>
        <SidebarRight />
      </div>
      {console.log(user)}
          </>
  );
}

export default Home;
