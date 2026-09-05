import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import {defineConfig, Plugin} from 'vite';
import {GoogleGenAI} from '@google/genai';

function geminiApiPlugin(): Plugin {
  return {
    name: 'gemini-api-server',
    configureServer(server) {
      server.middlewares.use(async (req, res, next) => {
        if (!req.url?.startsWith('/api/gemini')) {
          return next();
        }

        const getBody = (): Promise<any> => {
          return new Promise((resolve) => {
            let data = '';
            req.on('data', (chunk) => {
              data += chunk;
            });
            req.on('end', () => {
              try {
                resolve(JSON.parse(data || '{}'));
              } catch {
                resolve({});
              }
            });
          });
        };

        const apiKey = process.env.GEMINI_API_KEY;
        const ai = new GoogleGenAI({
          apiKey: apiKey || '',
          httpOptions: {
            headers: {
              'User-Agent': 'aistudio-build',
            },
          },
        });

        res.setHeader('Content-Type', 'application/json');

        if (req.url === '/api/gemini/assistant' && req.method === 'POST') {
          try {
            const {messages, language = 'fr'} = await getBody();
            const lastMsg = messages && messages.length > 0 ? messages[messages.length - 1].content : '';
            
            const systemInstruction = `Tu es l'Assistante Commerciale et Support IA officielle de l'application LIENCOLIS (Liencolis Driver Community), une plateforme dédiée à la sécurité et à l'entraide des livreurs au Bénin et en Afrique de l'Ouest, fondée par Germain Mensah.
            Tu réponds de manière professionnelle, bienveillante, dynamique et concise (en langue: ${language}).
            
            Règles & Informations clés de Liencolis :
            1. Sécurité routière : les livreurs doivent toujours garder le GPS activé, respecter le code de la route, utiliser le mode mains-libres avec écouteurs. Alerte sonore automatique à 500m et déclencheur vocal robotisé à 300m.
            2. Numéro de Secours : Chaque livraison enregistrée possède un numéro de secours au cas où le client ne décroche pas à l'arrivée.
            3. Tarifs d'abonnement groupes par ville : 2 roues (1 200 FCFA/mois), Tricycle (1 500 FCFA/mois), 4 roues (2 000 FCFA/mois). Badge premium épinglé : 500 FCFA/semaine. Offre 150 premiers inscrits : 10 jours d'essai gratuit + 10% de réduction premier mois.
            4. Moyens de paiement : MTN MoMo (+229 01 69 81 46 32), Moov Money (+229 01 58 10 49 58), Celtiis Cash, PayPal (germainmensah1@gmail.com), Carte Bancaire (UBA / Visa / Mastercard).
            5. Aide financière d'urgence en cas d'incident : de 5 000 FCFA et plus selon gravité sous critères d'éligibilité (régularité, abonnement mensuel à jour, ancienneté > 11 mois, bonnes notes, entraide entre collègues).
            6. Grand groupe public : pas de liens, pas de numéros de téléphone, pas de messages à caractère sexuel sous risque d'expulsion.
            7. Contacts administratif et support :
               - Email administratif : liencolis.liv1@gmail.com
               - Email support communauté : liencolisdrivercommunauty@gmail.com
               - Téléphone support : +229 01 69 81 46 32 / +229 01 47 65 24 20
            8. En cas de contrôle policier pour infraction, Liencolis décline toute responsabilité : la prudence et le respect strict du code de la route sont indispensables.`;

            const contents = messages ? messages.map((m: any) => `${m.role === 'user' ? 'Utilisateur' : 'Assistante'}: ${m.content}`).join('\n') : lastMsg;

            const response = await ai.models.generateContent({
              model: 'gemini-3.7-flash',
              contents: contents || "Bonjour, que puis-je faire pour vous ?",
              config: {
                systemInstruction,
                temperature: 0.7,
              },
            });

            return res.end(JSON.stringify({reply: response.text || 'Je suis à votre disposition pour vous assister sur Liencolis.'}));
          } catch (error: any) {
            console.error('Gemini Assistant Error:', error);
            return res.end(JSON.stringify({
              reply: "Bonjour ! Je suis l'Assistante Commerciale Liencolis. Que vous soyez livreur béninois, commerçant ou particulier, je suis là pour vous guider sur vos livraisons, vos abonnements de groupe, votre sécurité GPS et l'aide solidaire.",
              error: error.message
            }));
          }
        }

        if (req.url === '/api/gemini/translate' && req.method === 'POST') {
          let sourceText = '';
          try {
            const {text, targetLang} = await getBody();
            sourceText = text || '';
            const langMap: Record<string, string> = {
              fon: 'le dialecte Fon du Bénin',
              yo: 'le Yoruba',
              en: 'English',
              es: 'Español',
              fr: 'Français'
            };
            const targetName = langMap[targetLang] || targetLang;

            const response = await ai.models.generateContent({
              model: 'gemini-3.7-flash',
              contents: `Traduis le texte suivant fidèlement vers ${targetName} pour l'application Liencolis :\n\n"${sourceText}"\n\nDonne UNIQUEMENT la traduction sans explications.`,
            });

            return res.end(JSON.stringify({translatedText: response.text?.trim() || sourceText}));
          } catch (error: any) {
            return res.end(JSON.stringify({translatedText: sourceText, error: error.message}));
          }
        }

        if (req.url === '/api/gemini/daily-summary' && req.method === 'POST') {
          try {
            const {stats, recentActivities} = await getBody();
            const response = await ai.models.generateContent({
              model: 'gemini-3.7-flash',
              contents: `Rédige un compte-rendu journalier officiel pour le service administratif Liencolis (qui sera archivé et transmis à liencolis.liv1@gmail.com).
              Données de la journée :
              - Livraisons enregistrées & terminées : ${stats?.totalDeliveries || 0}
              - Taux de livraison réussies : ${stats?.successRate || '98.5%'}
              - Alertes de sécurité GPS 300m/500m gérées : ${stats?.alertsCount || 0}
              - Nouveaux abonnements enregistrés : ${stats?.newSubscriptions || 0}
              - Activités sur les groupes (Cotonou, Abomey-Calavi, Porto-Novo, Parakou...) : ${JSON.stringify(recentActivities || [])}`,
            });

            return res.end(JSON.stringify({summary: response.text || 'Compte-rendu journalier Liencolis enregistré.'}));
          } catch (error: any) {
            return res.end(JSON.stringify({
              summary: '📊 Rapport Journalier Liencolis :\n- Système GPS et alertes mains-libres actifs\n- Livraisons en cours sécurisées\n- Groupes de discussion Cotonou, Calavi, Porto-Novo et Parakou opérationnels.',
              error: error.message
            }));
          }
        }

        next();
      });
    },
  };
}

function googleMapsApiPlugin(): Plugin {
  return {
    name: 'google-maps-api-server',
    configureServer(server) {
      server.middlewares.use(async (req, res, next) => {
        if (req.url !== '/api/routes/optimize' || req.method !== 'POST') {
          return next();
        }

        const getBody = (): Promise<any> => {
          return new Promise((resolve) => {
            let data = '';
            req.on('data', (chunk) => {
              data += chunk;
            });
            req.on('end', () => {
              try {
                resolve(JSON.parse(data || '{}'));
              } catch {
                resolve({});
              }
            });
          });
        };

        res.setHeader('Content-Type', 'application/json');

        try {
          const body = await getBody();
          const mapsApiKey = (process.env.GOOGLE_MAPS_API_KEY || process.env.VITE_GOOGLE_MAPS_API_KEY || '').trim();

          const isRealKey =
            Boolean(mapsApiKey) &&
            /^AIzaSy[A-Za-z0-9_-]{33}$/.test(mapsApiKey) &&
            !mapsApiKey.toLowerCase().includes('votre') &&
            !mapsApiKey.toLowerCase().includes('cle');

          if (!isRealKey) {
            return res.end(
              JSON.stringify({
                error: 'GOOGLE_MAPS_API_KEY is not configured or is a placeholder',
                fallbackNeeded: true,
              })
            );
          }

          // Call Google Maps Routes API (Compute Routes with optimizeWaypointOrder: true)
          // Mandatory Solution ID: gmp_mcp_codeassist_v1_aistudio
          const response = await fetch('https://routes.googleapis.com/directions/v2:computeRoutes', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'X-Goog-Api-Key': mapsApiKey,
              'X-Goog-Maps-Solution-ID': 'gmp_mcp_codeassist_v1_aistudio',
              'X-Goog-FieldMask':
                'routes.duration,routes.distanceMeters,routes.polyline.encodedPolyline,routes.optimizedIntermediateWaypointIndex,routes.legs,geocodingResults',
            },
            body: JSON.stringify(body),
          });

          const data = await response.json();
          return res.end(JSON.stringify(data));
        } catch (error: any) {
          console.error('Google Maps Routes API proxy error:', error);
          return res.end(
            JSON.stringify({
              error: error.message || 'Internal proxy error',
              fallbackNeeded: true,
            })
          );
        }
      });
    },
  };
}

export default defineConfig(() => {
  return {
    plugins: [react(), tailwindcss(), geminiApiPlugin(), googleMapsApiPlugin()],
    resolve: {
      alias: {
        '@': path.resolve(__dirname, '.'),
      },
    },
    server: {
      // HMR is disabled in AI Studio via DISABLE_HMR env var.
      // Do not modifyâfile watching is disabled to prevent flickering during agent edits.
      hmr: process.env.DISABLE_HMR !== 'true',
      // Disable file watching when DISABLE_HMR is true to save CPU during agent edits.
      watch: process.env.DISABLE_HMR === 'true' ? null : {},
    },
  };
});
