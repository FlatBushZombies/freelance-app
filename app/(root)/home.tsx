import { useUser } from "@clerk/clerk-expo";
import { useEffect, useState } from "react";
import { router } from "expo-router";
import {
  View,
  Text,
  TextInput,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { NotificationBell } from "@/components/Notifications";
import { fetchAPI } from "@/lib/fetch";

interface Job {
  id: string;
  title: string;
  description: string;
  budget: number;
  category: string;
  location: string;
  createdAt: string;
  clientName: string;
  clientRating: number;
}

const Home = () => {
  const { user, isSignedIn } = useUser();
  const [jobs, setJobs] = useState<Job[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [userSkills, setUserSkills] = useState("");
  const [isSearching, setIsSearching] = useState(false);

    useEffect(() => {
    if (isSignedIn === false) {
      router.replace("/"); // Redirect to home/landing page
    }
  }, [isSignedIn]);

  const fetchUserSkills = async () => {
    try {
      if (!user?.id) return;
      const response = await fetchAPI(`/api/user/get?clerkId=${user?.id}`);
      if (response.user?.skills) {
        setUserSkills(response.user.skills);
        setSearchQuery(response.user.skills);
      }
    } catch (error) {
      console.error("[v0] Error fetching user skills:", error);
    }
  };

  // Fetch jobs from backend
  const fetchJobs = async () => {
    try {
      const response = await fetch("https://quickhands-api.vercel.app/api/jobs");
      const data = await response.json();

      if (data.success && Array.isArray(data.data)) {
        // Transform backend data to fit Job structure
        const mappedJobs = data.data.map((job: any) => ({
          id: String(job.id),
          title: job.serviceType || "Untitled Job",
          description: job.additionalInfo || "No description available",
          budget: parseFloat(job.maxPrice) || 0,
          category: job.selectedServices?.join(", ") || job.serviceType || "General",
          location: job.specialistChoice || "Remote",
          createdAt: job.startDate || new Date().toISOString(),
          clientName: "Anonymous Client",
          clientRating: 4.5,
        }));

        setJobs(mappedJobs);
      } else {
        setJobs([]);
      }
    } catch (error) {
      console.error("[v0] Error fetching jobs:", error);
      setJobs([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };
  const searchJobs = async (query: string) => {
    if (!query.trim()) {
      fetchJobs();
      return;
    }

    setIsSearching(true);
    try {
      const response = await fetch(
        `https://quickhands-api.vercel.app/api/jobs/search?q=${encodeURIComponent(query)}`
      );
      const data = await response.json();

      if (data.success && Array.isArray(data.data) && data.data.length > 0) {
        const mappedJobs = data.data.map((job: any) => ({
          id: String(job.id),
          title: job.serviceType || "Untitled Job",
          description: job.additionalInfo || "No description available",
          budget: parseFloat(job.maxPrice) || 0,
          category: job.selectedServices?.join(", ") || job.serviceType || "General",
          location: job.specialistChoice || "Remote",
          createdAt: job.startDate || new Date().toISOString(),
          clientName: "Anonymous Client",
          clientRating: 4.5,
        }));
        setJobs(mappedJobs);
      } else {
        await fetchJobs();
      }
    } catch (error) {
      console.error("[v0] Error searching jobs:", error);
      await fetchJobs();
    } finally {
      setIsSearching(false);
    }
  };

  useEffect(() => {
    fetchUserSkills();
    fetchJobs();
  }, [user]);

  useEffect(() => {
    if (userSkills && jobs.length > 0) {
      searchJobs(userSkills);
    }
  }, [userSkills]);

  const handleSearch = (query: string) => {
    setSearchQuery(query);
    searchJobs(query);
  };

  const onRefresh = () => {
    setRefreshing(true);
    if (searchQuery.trim()) {
      searchJobs(searchQuery);
    } else {
      fetchJobs();
    }
  };

  const formatTimeAgo = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInMs = now.getTime() - date.getTime();
    const diffInHours = Math.floor(diffInMs / (1000 * 60 * 60));
    const diffInDays = Math.floor(diffInHours / 24);

    if (diffInDays > 0) return `${diffInDays} day${diffInDays > 1 ? "s" : ""} ago`;
    if (diffInHours > 0) return `${diffInHours} hour${diffInHours > 1 ? "s" : ""} ago`;
    return "Just now";
  };

  const renderJobCard = ({ item }: { item: Job }) => (
    <TouchableOpacity
      className="mb-4 bg-white rounded-3xl overflow-hidden shadow-sm border border-gray-100"
      activeOpacity={0.7}
    >
      <View className="p-5 pb-4">
        <View className="flex-row items-start justify-between mb-3">
          <View className="flex-1 mr-3">
            <Text className="text-lg font-bold text-gray-900 mb-1 leading-tight">
              {item.title}
            </Text>
            <View className="flex-row items-center">
              <View className="px-3 py-1 rounded-full bg-gray-100">
                <Text className="text-xs font-semibold text-gray-800">
                  {item.category}
                </Text>
              </View>
            </View>
          </View>
          <View className="items-end">
            <Text className="text-2xl font-bold text-gray-900">
              ${item.budget}
            </Text>
            <Text className="text-xs text-gray-500">Budget</Text>
          </View>
        </View>

        <Text className="text-gray-600 text-sm leading-relaxed mb-4" numberOfLines={2}>
          {item.description}
        </Text>

        <View className="flex-row items-center justify-between pt-4 border-t border-gray-100">
          <View className="flex-row items-center flex-1">
            <View className="w-10 h-10 rounded-full items-center justify-center mr-3 bg-gray-100">
              <Text className="text-lg">👤</Text>
            </View>
            <View className="flex-1">
              <Text className="text-sm font-semibold text-gray-900">{item.clientName}</Text>
              <View className="flex-row items-center">
                <Text className="text-yellow-500 text-xs mr-1">★</Text>
                <Text className="text-xs text-gray-600">
                  {item.clientRating.toFixed(1)} • {item.location}
                </Text>
              </View>
            </View>
          </View>

          <TouchableOpacity className="px-5 py-2.5 rounded-full bg-gray-900">
            <Text className="text-white text-sm font-semibold">Apply</Text>
          </TouchableOpacity>
        </View>
      </View>

      <View className="px-5 py-3 bg-gray-50 border-t border-gray-100">
        <Text className="text-xs text-gray-500">
          Posted {formatTimeAgo(item.createdAt)}
        </Text>
      </View>
    </TouchableOpacity>
  );

  if (loading) {
    return (
      <SafeAreaView className="flex-1 bg-white items-center justify-center">
        <ActivityIndicator size="large" color="#111827" />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-gray-50">
      {/* Header */}
      <View className="px-6 pt-4 pb-6 bg-white border-b border-gray-100">
        <View className="flex-row items-center justify-between mb-4">
          <View>
            <Text className="text-gray-500 text-sm">Welcome back,</Text>
            <Text className="text-2xl font-bold text-gray-900">
              {user?.firstName || "Freelancer"}
            </Text>
          </View>
          {user?.id && <NotificationBell userId={user.id} />}
        </View>

        {/* Search Bar */}
        <View className="flex-row items-center bg-gray-50 rounded-2xl px-4 py-3 border border-gray-200">
          {isSearching ? (
            <ActivityIndicator size="small" color="#111827" className="mr-2" />
          ) : (
            <Text className="text-gray-400 text-lg mr-2">🔍</Text>
          )}
          <TextInput
            value={searchQuery}
            onChangeText={handleSearch}
            placeholder="Search for services..."
            placeholderTextColor="#9CA3AF"
            className="flex-1 text-gray-900 text-base"
            editable={!isSearching}
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity onPress={() => handleSearch("")}>
              <Text className="text-gray-400 text-lg">✕</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* Jobs List */}
      <FlatList
        data={jobs}
        renderItem={renderJobCard}
        keyExtractor={(item) => item.id}
        contentContainerStyle={{ padding: 20, paddingBottom: 40 }}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor="#111827"
          />
        }
        ListEmptyComponent={
          <View className="items-center justify-center py-20">
            <Text className="text-6xl mb-4">🔍</Text>
            <Text className="text-gray-900 text-lg font-semibold mb-2">
              No jobs found
            </Text>
            <Text className="text-gray-500 text-center">
              Try adjusting your search criteria
            </Text>
          </View>
        }
      />
    </SafeAreaView>
  );
};

export default Home;
