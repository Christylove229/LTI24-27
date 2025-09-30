import React from 'react';
import { motion } from 'framer-motion';

const Resources: React.FC = () => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="max-w-7xl mx-auto"
    >
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-8">
        <div className="text-center">
          <div className="w-24 h-24 bg-yellow-100 dark:bg-yellow-900 rounded-full flex items-center justify-center mx-auto mb-4">
            <span className="text-4xl">📚</span>
          </div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
            Bibliothèque de Ressources
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mb-8">
            Accédez à tous les documents partagés : cours, exercices, projets et bien plus.
          </p>
          <div className="bg-yellow-50 dark:bg-yellow-900/20 rounded-lg p-6">
            <p className="text-yellow-800 dark:text-yellow-200">
              🚧 Cette fonctionnalité sera disponible prochainement. 
              Vous pourrez télécharger et partager des fichiers, les organiser par matière et semestre.
            </p>
          </div>
        </div>
      </div>
    </motion.div>
  );
};

export default Resources;