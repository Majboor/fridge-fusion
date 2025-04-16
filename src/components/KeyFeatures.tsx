
import React from 'react';
import { motion } from 'framer-motion';
import {
  Camera,
  Scan,
  Heart,
  Trophy,
  Users,
  BarChart2,
  ShieldAlert,
  Leaf,
  Mic
} from 'lucide-react';

interface FeatureProps {
  icon: React.ReactNode;
  title: string;
  description: string;
  delay?: number;
}

const Feature = ({ icon, title, description, delay = 0 }: FeatureProps) => (
  <motion.div 
    initial={{ opacity: 0, y: 20 }}
    whileInView={{ opacity: 1, y: 0 }}
    viewport={{ once: true }}
    transition={{ delay: 0.1 + delay * 0.1, duration: 0.5 }}
    className="bg-white rounded-xl p-6 shadow-md hover:shadow-lg transition-shadow flex"
  >
    <div className="mr-4 p-3 bg-green-50 rounded-full shrink-0">
      <div className="text-green-600">
        {icon}
      </div>
    </div>
    <div>
      <h3 className="text-lg font-semibold mb-2 text-gray-800">{title}</h3>
      <p className="text-gray-600 text-sm">{description}</p>
    </div>
  </motion.div>
);

export const KeyFeatures = () => {
  const features = [
    {
      icon: <Camera className="h-6 w-6" />,
      title: "Snap & Cook",
      description: "Upload a photo of your ingredients and get AI-generated recipes instantly."
    },
    {
      icon: <Scan className="h-6 w-6" />,
      title: "Ingredient Detection",
      description: "AI auto-detects all ingredients and suggests smart meal options."
    },
    {
      icon: <Heart className="h-6 w-6" />,
      title: "Personalized Nutrition",
      description: "Get custom meal plans and timely alerts tailored to your health profile."
    },
    {
      icon: <Trophy className="h-6 w-6" />,
      title: "Gamification",
      description: "Earn achievements by scanning food items and completing challenges."
    },
    {
      icon: <Users className="h-6 w-6" />,
      title: "Community Vibes",
      description: "Share recipes, challenge friends, and compete in recipe battles."
    },
    {
      icon: <BarChart2 className="h-6 w-6" />,
      title: "Core Nutrition Tools",
      description: "Scan for calories, macronutrients, micronutrients, and more."
    },
    {
      icon: <ShieldAlert className="h-6 w-6" />,
      title: "Allergy Profiles",
      description: "Set preferences and avoid allergens with intelligent filtering."
    },
    {
      icon: <Leaf className="h-6 w-6" />,
      title: "Eco-Driven Fun",
      description: "Leaderboards, monthly eco-points, and sustainability incentives."
    },
    {
      icon: <Mic className="h-6 w-6" />,
      title: "Voice Interface",
      description: "Ask your AI chef questions and get answers hands-free."
    }
  ];

  return (
    <section className="py-20 bg-gradient-to-b from-gray-50 to-white">
      <div className="container mx-auto px-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.7 }}
          className="text-center mb-16"
        >
          <span className="inline-block px-3 py-1 bg-green-100 text-green-700 rounded-full text-sm font-medium mb-4">
            Powerful Features
          </span>
          <h2 className="text-4xl font-bold text-gray-900 mb-4">Everything You Need in One App</h2>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            Our comprehensive set of features makes healthy eating simple, fun, and personalized.
          </p>
        </motion.div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-6xl mx-auto">
          {features.map((feature, index) => (
            <Feature
              key={index}
              icon={feature.icon}
              title={feature.title}
              description={feature.description}
              delay={index}
            />
          ))}
        </div>
      </div>
    </section>
  );
};

export default KeyFeatures;
