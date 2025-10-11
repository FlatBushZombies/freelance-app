// screens/ChatScreen.tsx
import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  FlatList,
  ListRenderItem,
} from "react-native";

type Message = {
  id: string;
  text: string;
  sender: "me" | "other";
};

export default function ChatScreen() {
  const [messages, setMessages] = useState<Message[]>([
    { id: "1", text: "Hey, how are you?", sender: "other" },
    { id: "2", text: "I’m good! What about you?", sender: "me" },
  ]);
  const [input, setInput] = useState("");

  const sendMessage = () => {
    if (input.trim() === "") return;
    const newMessage: Message = {
      id: Date.now().toString(),
      text: input,
      sender: "me",
    };
    setMessages((prev) => [...prev, newMessage]);
    setInput("");
  };

  const renderMessage: ListRenderItem<Message> = ({ item }) => (
    <View
      className={`max-w-[75%] px-4 py-2 rounded-2xl mb-3 ${
        item.sender === "me"
          ? "bg-blue-500 self-end"
          : "bg-gray-200 self-start"
      }`}
    >
      <Text
        className={`text-base ${
          item.sender === "me" ? "text-white" : "text-gray-800"
        }`}
      >
        {item.text}
      </Text>
    </View>
  );

  return (
    <View className="flex-1 bg-gray-50">
      {/* Messages */}
      <FlatList
        data={messages}
        keyExtractor={(item) => item.id}
        renderItem={renderMessage}
        contentContainerStyle={{ padding: 16 }}
      />

      {/* Input Box */}
      <View className="flex-row items-center border-t border-gray-300 px-3 py-2 bg-white">
        <TextInput
          value={input}
          onChangeText={setInput}
          placeholder="Type a message..."
          className="flex-1 bg-gray-100 px-4 py-3 rounded-full text-base"
        />
        <TouchableOpacity
          onPress={sendMessage}
          className="ml-3 bg-blue-500 p-3 rounded-full"
        >
          <Text className="text-white font-medium">Send</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}
