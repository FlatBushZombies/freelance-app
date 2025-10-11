import { View, Text, TouchableOpacity, ScrollView } from "react-native"
import { Ionicons } from "@expo/vector-icons"

const WalletComponent = () => {
  // Mock wallet data - in a real app, this would come from your backend
  const walletData = {
    balance: 2450.75,
    pendingEarnings: 850.0,
    totalEarnings: 12350.5,
    currency: "USD",
  }

  const transactions = [
    {
      id: 1,
      type: "credit",
      amount: 500.0,
      description: "Payment from Sarah Johnson",
      project: "E-commerce Website Development",
      date: "2024-01-15",
      status: "completed",
    },
    {
      id: 2,
      type: "debit",
      amount: 25.0,
      description: "Platform fee",
      date: "2024-01-15",
      status: "completed",
    },
    {
      id: 3,
      type: "credit",
      amount: 360.0,
      description: "Payment from TechStart Inc.",
      project: "Mobile App UI/UX Design",
      date: "2024-01-12",
      status: "completed",
    },
    {
      id: 4,
      type: "pending",
      amount: 240.0,
      description: "Pending payment from Dr. Amanda Rodriguez",
      project: "Content Writing for Health Blog",
      date: "2024-01-10",
      status: "pending",
    },
    {
      id: 5,
      type: "credit",
      amount: 1200.0,
      description: "Payment from Fashion Forward",
      project: "Social Media Marketing Campaign",
      date: "2024-01-08",
      status: "completed",
    },
  ]

  const renderTransaction = (transaction: any) => (
    <View key={transaction.id} className="bg-white rounded-2xl p-4 shadow-sm mb-3">
      <View className="flex-row justify-between items-start mb-2">
        <View className="flex-1">
          <Text className="text-base font-semibold text-gray-900 mb-1">{transaction.description}</Text>
          {transaction.project && <Text className="text-sm text-gray-500 mb-1">{transaction.project}</Text>}
          <Text className="text-xs text-gray-400">{transaction.date}</Text>
        </View>
        <View className="items-end">
          <Text
            className={`text-lg font-bold ${
              transaction.type === "credit"
                ? "text-green-600"
                : transaction.type === "debit"
                  ? "text-red-600"
                  : "text-yellow-600"
            }`}
          >
            {transaction.type === "debit" ? "-" : "+"}${transaction.amount.toFixed(2)}
          </Text>
          <View
            className={`px-2 py-1 rounded-full mt-1 ${
              transaction.status === "completed" ? "bg-green-50" : "bg-yellow-50"
            }`}
          >
            <Text
              className={`text-xs font-medium ${
                transaction.status === "completed" ? "text-green-600" : "text-yellow-600"
              }`}
            >
              {transaction.status.toUpperCase()}
            </Text>
          </View>
        </View>
      </View>
    </View>
  )

  return (
    <ScrollView className="flex-1 px-4 py-4" showsVerticalScrollIndicator={false}>
      {/* Wallet Balance Card */}
      <View className="bg-gradient-to-r from-blue-600 to-purple-600 rounded-2xl p-6 mb-6">
        <View className="flex-row justify-between items-start mb-4">
          <View>
            <Text className="text-white/80 text-sm font-medium">Available Balance</Text>
            <Text className="text-white text-3xl font-bold mt-1">${walletData.balance.toFixed(2)}</Text>
          </View>
          <TouchableOpacity className="bg-white/20 rounded-full p-2">
            <Ionicons name="wallet-outline" size={24} color="white" />
          </TouchableOpacity>
        </View>

        <View className="flex-row justify-between">
          <View>
            <Text className="text-white/80 text-xs">Pending</Text>
            <Text className="text-white text-lg font-semibold">${walletData.pendingEarnings.toFixed(2)}</Text>
          </View>
          <View>
            <Text className="text-white/80 text-xs">Total Earned</Text>
            <Text className="text-white text-lg font-semibold">${walletData.totalEarnings.toFixed(2)}</Text>
          </View>
        </View>
      </View>

      {/* Quick Actions */}
      <View className="flex-row justify-between mb-6">
        <TouchableOpacity className="bg-white rounded-2xl p-4 flex-1 mr-2 shadow-sm items-center">
          <View className="bg-green-50 rounded-full p-3 mb-2">
            <Ionicons name="arrow-down" size={24} color="#10B981" />
          </View>
          <Text className="text-gray-900 font-semibold text-sm">Withdraw</Text>
        </TouchableOpacity>

        <TouchableOpacity className="bg-white rounded-2xl p-4 flex-1 mx-1 shadow-sm items-center">
          <View className="bg-blue-50 rounded-full p-3 mb-2">
            <Ionicons name="card-outline" size={24} color="#3B82F6" />
          </View>
          <Text className="text-gray-900 font-semibold text-sm">Add Card</Text>
        </TouchableOpacity>

        <TouchableOpacity className="bg-white rounded-2xl p-4 flex-1 ml-2 shadow-sm items-center">
          <View className="bg-purple-50 rounded-full p-3 mb-2">
            <Ionicons name="document-text-outline" size={24} color="#8B5CF6" />
          </View>
          <Text className="text-gray-900 font-semibold text-sm">Invoice</Text>
        </TouchableOpacity>
      </View>

      {/* Recent Transactions */}
      <View className="mb-4">
        <View className="flex-row justify-between items-center mb-4">
          <Text className="text-xl font-bold text-gray-900">Recent Transactions</Text>
          <TouchableOpacity>
            <Text className="text-blue-500 font-medium">View All</Text>
          </TouchableOpacity>
        </View>

        {transactions.map(renderTransaction)}
      </View>

      {/* Payment Methods */}
      <View className="mb-6">
        <Text className="text-xl font-bold text-gray-900 mb-4">Payment Methods</Text>

        <TouchableOpacity className="bg-white rounded-2xl p-4 shadow-sm mb-3">
          <View className="flex-row items-center">
            <View className="bg-blue-50 rounded-full p-3 mr-4">
              <Ionicons name="card" size={24} color="#3B82F6" />
            </View>
            <View className="flex-1">
              <Text className="text-gray-900 font-semibold">•••• •••• •••• 4532</Text>
              <Text className="text-gray-500 text-sm">Expires 12/26</Text>
            </View>
            <View className="bg-green-50 rounded-full px-2 py-1">
              <Text className="text-green-600 text-xs font-medium">PRIMARY</Text>
            </View>
          </View>
        </TouchableOpacity>

        <TouchableOpacity className="bg-white rounded-2xl p-4 shadow-sm border-2 border-dashed border-gray-200">
          <View className="flex-row items-center justify-center">
            <Ionicons name="add" size={24} color="#6B7280" />
            <Text className="text-gray-500 font-medium ml-2">Add Payment Method</Text>
          </View>
        </TouchableOpacity>
      </View>
    </ScrollView>
  )
}

export default WalletComponent
