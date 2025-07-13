import React from 'react';
import { motion } from 'framer-motion';

const StatsSection = () => {
  return (
    <section className="py-24 bg-gradient-to-br from-gray-50 to-gray-100">
      <div className="max-w-7xl mx-auto px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          viewport={{ once: true }}
          className="text-center mb-16"
        >
          <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-6">Our Achievements</h2>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            Discover the impact we've made through innovative solutions and collaborative efforts.
          </p>
        </motion.div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 text-center">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            viewport={{ once: true }}
          >
            <h3 className="text-5xl font-bold text-violet-600">120+</h3>
            <p className="text-lg text-gray-600">Active Projects</p>
          </motion.div>
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            viewport={{ once: true }}
          >
            <h3 className="text-5xl font-bold text-violet-600">300+</h3>
            <p className="text-lg text-gray-600">Community Partners</p>
          </motion.div>
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            viewport={{ once: true }}
          >
            <h3 className="text-5xl font-bold text-violet-600">99%</h3>
            <p className="text-lg text-gray-600">Satisfaction Rate</p>
          </motion.div>
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            viewport={{ once: true }}
          >
            <h3 className="text-5xl font-bold text-violet-600">48h</h3>
            <p className="text-lg text-gray-600">Average Resolution Time</p>
          </motion.div>
        </div>
      </div>
    </section>
  );
};

export default StatsSection;
