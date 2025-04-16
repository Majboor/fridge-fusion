
import React from 'react';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { ArrowRight } from 'lucide-react';

interface FeaturedFeatureProps {
  title: string;
  description: string;
  image: string;
  imageAlt: string;
  direction?: 'left' | 'right';
}

const FeaturedFeature = ({
  title,
  description,
  image,
  imageAlt,
  direction = 'left'
}: FeaturedFeatureProps) => {
  return (
    <section className="py-16 relative overflow-hidden">
      <div
        className={`container mx-auto px-4 grid md:grid-cols-2 gap-12 items-center ${
          direction === 'right' ? 'md:grid-flow-dense' : ''
        }`}
      >
        <motion.div
          initial={{ opacity: 0, x: direction === 'left' ? -40 : 40 }}
          whileInView={{ opacity: 1, x: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.7 }}
          className={`${direction === 'right' ? 'md:col-start-2' : ''}`}
        >
          <div className="mb-6">
            <span className="inline-block px-3 py-1 bg-green-100 text-green-700 rounded-full text-sm font-medium">
              Featured
            </span>
          </div>
          <h2 className="text-3xl md:text-4xl font-bold mb-4 text-gray-800">{title}</h2>
          <p className="text-lg text-gray-600 mb-6">{description}</p>
          <Button className="group">
            Learn more <ArrowRight className="ml-2 h-4 w-4 group-hover:translate-x-1 transition-transform" />
          </Button>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, x: direction === 'left' ? 40 : -40 }}
          whileInView={{ opacity: 1, x: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.7 }}
          className={`relative ${direction === 'right' ? 'md:col-start-1' : 'md:col-start-2'}`}
        >
          <div className="relative rounded-2xl overflow-hidden shadow-xl">
            <div className="absolute inset-0 bg-gradient-to-tr from-green-500/20 to-transparent z-10"></div>
            <img
              src={image}
              alt={imageAlt}
              className="w-full h-full object-cover"
            />
          </div>
          <div className="absolute -z-10 bg-green-100 rounded-full w-64 h-64 blur-3xl opacity-30 -bottom-10 -right-10"></div>
        </motion.div>
      </div>
    </section>
  );
};

export default FeaturedFeature;
