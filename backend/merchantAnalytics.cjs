const express = require("express");
const mongoose = require("mongoose");

const router = express.Router();

/**
 * Helper: Summarize array-based analytics fields
 * Converts raw arrays into analytics-friendly data
 */
function summarizeArrayField(docs, fieldName) {
  const allItems = docs
    .map((doc) => doc[fieldName])
    .filter(Boolean)
    .flat();

  return {
    enabled: allItems.length > 0,
    total: allItems.length,
    completed: allItems.filter((item) => item?.completed === true).length,
  };
}

/**
 * Helper: Get first available value from documents
 */
function getFirstValue(docs, fieldName) {
  const doc = docs.find((d) => d[fieldName] !== undefined);
  return doc ? doc[fieldName] : null;
}

router.get("/merchant-analytics/all-stores", async (req, res) => {
  try {
    if (mongoose.connection.readyState !== 1) {
      return res.status(503).json({ error: "Database not connected" });
    }

    const merchantDb = mongoose.connection.useDb("Y_Merchant_Store_Data");
    const collections = await merchantDb.db.listCollections().toArray();

    const results = await Promise.all(
      collections.map(async (col) => {
        const docs = await merchantDb.db
          .collection(col.name)
          .find({
            $or: [
              { status: { $exists: true } },
              { app_status: { $exists: true } },
              { appStatusStandardAccount: { $exists: true } },
              { onboardingCompleted: { $exists: true } },
              { klaviyoIntegration: { $exists: true } },
              { mailchimpIntegration: { $exists: true } },
              { omnisendIntegration: { $exists: true } },
              { newShopifyPricing: { $exists: true } },
              { standardAccountTabsMenu: { $exists: true } },
              { flowProgramsCount: { $exists: true } },
              { newCustomerAccountProfileFields: { $exists: true } },
              { registerAccountFields: { $exists: true } },
              { advancedAccountTabsMenu: { $exists: true } },
              { advancedAccountSettings: { $exists: true } },
              { legacyCustomerAccountFields: { $exists: true } },
              { accountVesionAndLastSessionActivity: { $exists: true } },
              { formBuilder: { $exists: true } },
              { summary: { $exists: true } },
            ],
          })
          .project({
            status: 1,
            app_status: 1,
            appStatusStandardAccount: 1,
            onboardingCompleted: 1,
            klaviyoIntegration: 1,
            mailchimpIntegration: 1,
            omnisendIntegration: 1,
            newShopifyPricing: 1,
            standardAccountTabsMenu: 1,
            flowProgramsCount: 1,
            newCustomerAccountProfileFields: 1,
            registerAccountFields: 1,
            advancedAccountTabsMenu: 1,
            advancedAccountSettings: 1,
            legacyCustomerAccountFields: 1,
            accountVesionAndLastSessionActivity: 1,
            formBuilder: 1,
            summary: 1,
          })
          .toArray();

        return {
          storeName: col.name,

          // Single-value fields
          status: getFirstValue(docs, "status"),
          app_status: getFirstValue(docs, "app_status"),
          appStatusStandardAccount: getFirstValue(
            docs,
            "appStatusStandardAccount"
          ),
          newShopifyPricing: getFirstValue(docs, "newShopifyPricing"),
          flowProgramsCount: getFirstValue(docs, "flowProgramsCount"),
          summary: getFirstValue(docs, "summary"),

          // Boolean-based analytics
          onboardingCompleted: docs.some((d) => d.onboardingCompleted === true),
          klaviyoIntegration: docs.some((d) => d.klaviyoIntegration === true),
          mailchimpIntegration: docs.some(
            (d) => d.mailchimpIntegration === true
          ),
          omnisendIntegration: docs.some((d) => d.omnisendIntegration === true),
          standardAccountTabsMenu: docs.some(
            (d) => d.standardAccountTabsMenu === true
          ),
          advancedAccountTabsMenu: docs.some(
            (d) => d.advancedAccountTabsMenu === true
          ),
          advancedAccountSettings: docs.some(
            (d) => d.advancedAccountSettings === true
          ),
          legacyCustomerAccountFields: docs.some(
            (d) => d.legacyCustomerAccountFields === true
          ),
          accountVesionAndLastSessionActivity: docs.some(
            (d) => d.accountVesionAndLastSessionActivity === true
          ),
          formBuilder: docs.some((d) => d.formBuilder === true),

          // Array-based analytics (IMPORTANT FIX)
          newCustomerAccountProfileFields: summarizeArrayField(
            docs,
            "newCustomerAccountProfileFields"
          ),

          registerAccountFields: summarizeArrayField(
            docs,
            "registerAccountFields"
          ),
        };
      })
    );

    res.json(results);
  } catch (err) {
    console.error("Error fetching analytics data:", err);
    res.status(500).json({ error: "Error fetching analytics data" });
  }
});

module.exports = router;
