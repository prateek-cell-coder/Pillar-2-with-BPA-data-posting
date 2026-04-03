using { com.bosch.pillar as db } from '../db/schema';

@path: '/pillar2'
service Pillar2Service {

  action triggerProcessAutomation(
    system           : String,
    companyCode      : String,
    deactivationFrom : Date,
    deactivationTo   : Date,
    transactionType  : String,
    depreciationArea : String,
    sortVariant      : String
  ) returns {
    success : Boolean;
    message : String;
  };

}