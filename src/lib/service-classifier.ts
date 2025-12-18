/**
 * Modelo de Clasificación de Servicios con TensorFlow.js
 *
 * Este modelo clasifica las necesidades del usuario en 5 categorías principales:
 * 1. Desarrollo Web/API
 * 2. Desarrollo Móvil
 * 3. Integración de IA
 * 4. Revisión de Arquitectura
 * 5. Consultoría General
 */

import * as tf from '@tensorflow/tfjs';

export interface QuestionnaireData {
  project_type: string;
  project_stage: string;
  budget: string;
  timeline: string;
  expected_users: string;
  features: string[];
  has_team: string;
  priority: string;
  description?: string;
}

export interface ClassificationResult {
  service: string;
  confidence: number;
  recommendations: string[];
  estimatedDuration: string;
  suggestedApproach: string;
}

// Mapeo de servicios
const SERVICES = {
  0: 'Desarrollo Web/API',
  1: 'Desarrollo Móvil',
  2: 'Integración de IA',
  3: 'Revisión de Arquitectura',
  4: 'Consultoría General'
};

/**
 * Codifica las características del cuestionario en un vector numérico
 */
function encodeFeatures(data: QuestionnaireData): number[] {
  const features: number[] = [];

  // 1. Tipo de proyecto (one-hot encoding)
  const projectTypes = ['web_app', 'mobile_app', 'api_backend', 'ai_integration', 'architecture_review', 'other'];
  projectTypes.forEach(type => {
    features.push(data.project_type === type ? 1 : 0);
  });

  // 2. Etapa del proyecto (ordinal encoding)
  const stageMap: { [key: string]: number } = {
    'idea': 0.2,
    'planning': 0.4,
    'development': 0.6,
    'production': 0.8,
    'scaling': 1.0
  };
  features.push(stageMap[data.project_stage] || 0.5);

  // 3. Presupuesto (ordinal encoding)
  const budgetMap: { [key: string]: number } = {
    'less_5k': 0.2,
    '5k_15k': 0.4,
    '15k_50k': 0.6,
    '50k_100k': 0.8,
    'more_100k': 1.0
  };
  features.push(budgetMap[data.budget] || 0.5);

  // 4. Timeline (ordinal encoding)
  const timelineMap: { [key: string]: number } = {
    'urgent': 1.0,
    '1_3_months': 0.7,
    '3_6_months': 0.5,
    'more_6_months': 0.3,
    'flexible': 0.1
  };
  features.push(timelineMap[data.timeline] || 0.5);

  // 5. Usuarios esperados (ordinal encoding)
  const usersMap: { [key: string]: number } = {
    'less_100': 0.2,
    '100_1k': 0.4,
    '1k_10k': 0.6,
    '10k_100k': 0.8,
    'more_100k': 1.0
  };
  features.push(usersMap[data.expected_users] || 0.5);

  // 6. Features solicitadas (multi-hot encoding)
  const allFeatures = ['auth', 'payments', 'analytics', 'real_time', 'ai_ml', 'mobile', 'admin_panel'];
  allFeatures.forEach(feat => {
    features.push(data.features.includes(feat) ? 1 : 0);
  });

  // 7. Tiene equipo (binary)
  features.push(data.has_team === 'yes' ? 1 : 0);

  // 8. Prioridad (ordinal encoding)
  const priorityMap: { [key: string]: number } = {
    'speed': 1.0,
    'quality': 0.8,
    'cost': 0.3,
    'scalability': 0.6
  };
  features.push(priorityMap[data.priority] || 0.5);

  return features;
}

/**
 * Crea y entrena el modelo de clasificación
 */
export function createModel(): tf.LayersModel {
  const model = tf.sequential({
    layers: [
      // Capa de entrada: 22 features
      tf.layers.dense({
        inputShape: [22],
        units: 64,
        activation: 'relu',
        kernelInitializer: 'heNormal'
      }),
      tf.layers.dropout({ rate: 0.3 }),

      // Capa oculta 1
      tf.layers.dense({
        units: 32,
        activation: 'relu',
        kernelInitializer: 'heNormal'
      }),
      tf.layers.dropout({ rate: 0.2 }),

      // Capa oculta 2
      tf.layers.dense({
        units: 16,
        activation: 'relu',
        kernelInitializer: 'heNormal'
      }),

      // Capa de salida: 5 clases (servicios)
      tf.layers.dense({
        units: 5,
        activation: 'softmax'
      })
    ]
  });

  model.compile({
    optimizer: tf.train.adam(0.001),
    loss: 'categoricalCrossentropy',
    metrics: ['accuracy']
  });

  return model;
}

/**
 * Datos de entrenamiento sintéticos basados en patrones comunes
 */
function getTrainingData(): { inputs: number[][], labels: number[][] } {
  const inputs: number[][] = [];
  const labels: number[][] = [];

  // Patrón 1: Desarrollo Web/API (label: [1,0,0,0,0])
  for (let i = 0; i < 20; i++) {
    inputs.push([
      1,0,0,0,0,0, // web_app
      Math.random() * 0.5 + 0.3, // stage: planning-development
      Math.random() * 0.6 + 0.2, // budget: moderate
      Math.random() * 0.5 + 0.3, // timeline: 1-6 months
      Math.random() * 0.6 + 0.2, // users: moderate
      Math.random() > 0.5 ? 1 : 0, // auth
      Math.random() > 0.5 ? 1 : 0, // payments
      Math.random() > 0.5 ? 1 : 0, // analytics
      Math.random() > 0.3 ? 1 : 0, // real_time
      0, 0, // ai_ml, mobile (rare)
      Math.random() > 0.5 ? 1 : 0, // admin_panel
      Math.random() > 0.5 ? 1 : 0, // has_team
      Math.random() * 0.5 + 0.3  // priority
    ]);
    labels.push([1, 0, 0, 0, 0]);
  }

  // Patrón 2: Desarrollo Móvil (label: [0,1,0,0,0])
  for (let i = 0; i < 20; i++) {
    inputs.push([
      0,1,0,0,0,0, // mobile_app
      Math.random() * 0.5 + 0.2, // stage
      Math.random() * 0.6 + 0.3, // budget: higher
      Math.random() * 0.5 + 0.4, // timeline: longer
      Math.random() * 0.8 + 0.2, // users: many
      Math.random() > 0.3 ? 1 : 0, // auth
      Math.random() > 0.4 ? 1 : 0, // payments
      Math.random() > 0.4 ? 1 : 0, // analytics
      Math.random() > 0.4 ? 1 : 0, // real_time
      Math.random() > 0.6 ? 1 : 0, // ai_ml
      1, // mobile (always)
      Math.random() > 0.6 ? 1 : 0, // admin_panel
      Math.random() > 0.4 ? 1 : 0, // has_team
      Math.random() * 0.5 + 0.4  // priority
    ]);
    labels.push([0, 1, 0, 0, 0]);
  }

  // Patrón 3: Integración de IA (label: [0,0,1,0,0])
  for (let i = 0; i < 20; i++) {
    inputs.push([
      0,0,0,1,0,0, // ai_integration
      Math.random() * 0.5 + 0.4, // stage: development-production
      Math.random() * 0.6 + 0.4, // budget: higher
      Math.random() * 0.6 + 0.3, // timeline: flexible
      Math.random() * 0.8 + 0.2, // users
      Math.random() > 0.4 ? 1 : 0, // auth
      Math.random() > 0.6 ? 1 : 0, // payments
      Math.random() > 0.3 ? 1 : 0, // analytics
      Math.random() > 0.5 ? 1 : 0, // real_time
      1, // ai_ml (always)
      Math.random() > 0.7 ? 1 : 0, // mobile
      Math.random() > 0.5 ? 1 : 0, // admin_panel
      Math.random() > 0.6 ? 1 : 0, // has_team
      0.8  // priority: quality
    ]);
    labels.push([0, 0, 1, 0, 0]);
  }

  // Patrón 4: Revisión de Arquitectura (label: [0,0,0,1,0])
  for (let i = 0; i < 20; i++) {
    inputs.push([
      0,0,0,0,1,0, // architecture_review
      Math.random() * 0.4 + 0.6, // stage: production-scaling
      Math.random() * 0.6 + 0.3, // budget
      Math.random() * 0.5 + 0.2, // timeline: shorter
      Math.random() * 0.8 + 0.2, // users: many (scaling issues)
      Math.random() > 0.5 ? 1 : 0, // auth
      Math.random() > 0.5 ? 1 : 0, // payments
      Math.random() > 0.5 ? 1 : 0, // analytics
      Math.random() > 0.5 ? 1 : 0, // real_time
      Math.random() > 0.5 ? 1 : 0, // ai_ml
      Math.random() > 0.5 ? 1 : 0, // mobile
      Math.random() > 0.5 ? 1 : 0, // admin_panel
      1, // has_team (always - they need review)
      0.6  // priority: scalability
    ]);
    labels.push([0, 0, 0, 1, 0]);
  }

  // Patrón 5: Consultoría General (label: [0,0,0,0,1])
  for (let i = 0; i < 20; i++) {
    inputs.push([
      0,0,0,0,0,1, // other
      Math.random() * 0.6 + 0.1, // stage: idea-development
      Math.random() * 0.8 + 0.1, // budget: variable
      Math.random() * 0.8 + 0.1, // timeline: flexible
      Math.random() * 0.8 + 0.1, // users: variable
      Math.random() > 0.5 ? 1 : 0, // features: random
      Math.random() > 0.5 ? 1 : 0,
      Math.random() > 0.5 ? 1 : 0,
      Math.random() > 0.5 ? 1 : 0,
      Math.random() > 0.5 ? 1 : 0,
      Math.random() > 0.5 ? 1 : 0,
      Math.random() > 0.5 ? 1 : 0,
      Math.random() > 0.5 ? 1 : 0, // has_team: random
      Math.random()  // priority: random
    ]);
    labels.push([0, 0, 0, 0, 1]);
  }

  return { inputs, labels };
}

/**
 * Entrena el modelo con datos sintéticos
 */
export async function trainModel(model: tf.LayersModel): Promise<void> {
  const { inputs, labels } = getTrainingData();

  const xs = tf.tensor2d(inputs);
  const ys = tf.tensor2d(labels);

  await model.fit(xs, ys, {
    epochs: 50,
    batchSize: 10,
    shuffle: true,
    validationSplit: 0.2,
    verbose: 0,
    callbacks: {
      onEpochEnd: (epoch, logs) => {
        if (epoch % 10 === 0) {
          console.log(`Época ${epoch}: loss = ${logs?.loss.toFixed(4)}, acc = ${logs?.acc.toFixed(4)}`);
        }
      }
    }
  });

  xs.dispose();
  ys.dispose();

  console.log('✅ Modelo entrenado exitosamente');
}

/**
 * Genera recomendaciones detalladas basadas en el servicio clasificado
 */
function generateRecommendations(
  service: string,
  data: QuestionnaireData,
  confidence: number
): { recommendations: string[], estimatedDuration: string, suggestedApproach: string } {
  let recommendations: string[] = [];
  let estimatedDuration = '';
  let suggestedApproach = '';

  switch (service) {
    case 'Desarrollo Web/API':
      recommendations = [
        'Arquitectura basada en microservicios o monolito modular',
        'API RESTful o GraphQL según complejidad',
        'Base de datos relacional (PostgreSQL) o NoSQL (MongoDB)',
        'Deploy en servicios cloud (AWS, Google Cloud, o Azure)',
        'CI/CD con GitHub Actions o GitLab CI'
      ];
      estimatedDuration = data.timeline === 'urgent' ? '4-8 semanas' : '8-16 semanas';
      suggestedApproach = 'Desarrollo incremental con entregas semanales y feedback continuo';
      break;

    case 'Desarrollo Móvil':
      recommendations = [
        'React Native para desarrollo cross-platform',
        'Flutter si se requiere alto rendimiento',
        'Integración con APIs backend mediante REST o GraphQL',
        'Sistema de autenticación robusto (Firebase Auth, Auth0)',
        'Publicación en App Store y Google Play'
      ];
      estimatedDuration = data.budget === 'less_5k' ? '8-12 semanas' : '12-20 semanas';
      suggestedApproach = 'MVP inicial enfocado en features core, iteraciones basadas en feedback de usuarios';
      break;

    case 'Integración de IA':
      recommendations = [
        'Implementación de LLMs (GPT-4, Claude) según caso de uso',
        'Sistema RAG para conocimiento específico del dominio',
        'Arquitectura serverless para escalabilidad de costos',
        'Fine-tuning de modelos si es necesario',
        'Monitoreo de costos y performance de APIs de IA'
      ];
      estimatedDuration = '6-12 semanas';
      suggestedApproach = 'Proof of concept inicial, validación de viabilidad, implementación incremental';
      break;

    case 'Revisión de Arquitectura':
      recommendations = [
        'Auditoría completa del código y arquitectura actual',
        'Identificación de cuellos de botella y code smells',
        'Plan de refactorización priorizado',
        'Mejoras en seguridad y escalabilidad',
        'Documentación técnica y diagrams de arquitectura'
      ];
      estimatedDuration = '2-4 semanas';
      suggestedApproach = 'Análisis exhaustivo, reporte detallado con plan de acción priorizado';
      break;

    case 'Consultoría General':
      recommendations = [
        'Sesiones de mentoría técnica personalizadas',
        'Definición de stack tecnológico óptimo',
        'Roadmap de desarrollo con hitos claros',
        'Best practices y patrones de diseño',
        'Estrategia de testing y deployment'
      ];
      estimatedDuration = '1-4 semanas';
      suggestedApproach = 'Sesiones iterativas de asesoría, documentación de decisiones técnicas';
      break;
  }

  // Ajustar recomendaciones según presupuesto
  if (data.budget === 'less_5k') {
    recommendations.push('💡 Enfoque en MVP con features esenciales para optimizar presupuesto');
  } else if (data.budget === 'more_100k') {
    recommendations.push('💡 Oportunidad para implementar arquitectura enterprise-grade y escalable');
  }

  // Ajustar según urgencia
  if (data.timeline === 'urgent') {
    recommendations.push('⚡ Priorización estricta de features críticas para cumplir timeline');
  }

  return { recommendations, estimatedDuration, suggestedApproach };
}

/**
 * Clasifica los datos del cuestionario y devuelve recomendaciones
 */
export async function classifyService(data: QuestionnaireData): Promise<ClassificationResult> {
  console.log('🤖 Iniciando clasificación de servicio...');

  // Crear y entrenar modelo
  const model = createModel();
  await trainModel(model);

  // Codificar features
  const features = encodeFeatures(data);
  const inputTensor = tf.tensor2d([features]);

  // Hacer predicción
  const prediction = model.predict(inputTensor) as tf.Tensor;
  const probabilities = await prediction.data();

  // Encontrar la clase con mayor probabilidad
  let maxProb = 0;
  let maxIndex = 0;
  for (let i = 0; i < probabilities.length; i++) {
    if (probabilities[i] > maxProb) {
      maxProb = probabilities[i];
      maxIndex = i;
    }
  }

  const service = SERVICES[maxIndex as keyof typeof SERVICES];
  const confidence = maxProb;

  console.log(`✅ Clasificación: ${service} (confianza: ${(confidence * 100).toFixed(1)}%)`);

  // Generar recomendaciones
  const { recommendations, estimatedDuration, suggestedApproach } = generateRecommendations(
    service,
    data,
    confidence
  );

  // Limpiar memoria
  inputTensor.dispose();
  prediction.dispose();
  model.dispose();

  return {
    service,
    confidence,
    recommendations,
    estimatedDuration,
    suggestedApproach
  };
}
