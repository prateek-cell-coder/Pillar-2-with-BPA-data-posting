const cds = require('@sap/cds')

module.exports = cds.service.impl(async function () {

  const { ProcessAutomation, UploadSession, AssetRetirementRow } = this.entities

  // ── Trigger Process Automation ──
  this.on('triggerProcessAutomation', async (req) => {
    const {
      system, companyCode, deactivationFrom,
      deactivationTo, transactionType, depreciationArea, sortVariant
    } = req.data

    const record = await INSERT.into(ProcessAutomation).entries({
      system, companyCode, deactivationFrom,
      deactivationTo, transactionType, depreciationArea,
      sortVariant, status: 'TRIGGERED',
      triggeredAt: new Date().toISOString(),
      triggeredBy: req.user?.id || 'anonymous'
    })

    return {
      success: true,
      message: 'Process automation triggered successfully.',
      sessionID: record.ID || cds.utils.uuid()
    }
  })

  // ── Save formatted rows sent from frontend ──
  this.on('saveFormattedRows', async (req) => {
    const { sessionID, rows } = req.data
    if (!rows || rows.length === 0) {
      return { success: false, message: 'No rows provided.', rowsSaved: 0 }
    }

    const entries = rows.map(r => ({
      ...r,
      session_ID: sessionID,
      wasReformatted: true
    }))

    await INSERT.into(AssetRetirementRow).entries(entries)

    // Update session row count
    await UPDATE(UploadSession)
      .set({ formattedRows: rows.length, status: 'FORMATTED' })
      .where({ ID: sessionID })

    return {
      success: true,
      message: `${rows.length} rows saved successfully.`,
      rowsSaved: rows.length
    }
  })

  // ── Export rows for a session ──
  this.on('exportRows', async (req) => {
    const { sessionID } = req.data
    return await SELECT.from(AssetRetirementRow)
      .where({ session_ID: sessionID })
  })

  // ── Get upload sessions list ──
  this.on('getUploadSessions', async () => {
    return await SELECT.from(UploadSession)
      .columns('ID', 'fileName', 'originalRows', 'formattedRows', 'status', 'createdAt')
      .orderBy({ createdAt: 'desc' })
  })

})