# WAH4P

WAH4P needs these resources:

patient
procedure
immunization
observation
medication
encounter

all of these is R4.0.1 and the phcore validation standard we need is on resources/

Lets add a strict schema to the gateway endpoint for 

/receive/{resourceType} 

for the 6 resource types above. when a patient resource right is given by the target provider then we should validate and the schema must match the fhir resource structure definition for 6 resourcetypes