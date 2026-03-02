import { NextRequest, NextResponse } from 'next/server'
import { generateWithXAI } from '@/lib/xai'

export async function POST(req: NextRequest) {
  try {
    const { text, targetLanguage } = await req.json()

    const languageNames: Record<string, string> = {
      'yo': 'Yoruba',
      'ig': 'Igbo', 
      'ha': 'Hausa',
      'pcm': 'Nigerian Pidgin English',
      'fr': 'French',
      'en': 'English'
    }

    const targetLang = languageNames[targetLanguage] || targetLanguage

    if (!process.env.XAI_API_KEY) {
      return NextResponse.json({ success: false, error: 'AI service not configured. Please set XAI_API_KEY.' }, { status: 500 })
    }

    const systemPrompt = `You are an expert translator specializing in Nigerian languages and legal terminology. You can accurately translate legal documents while preserving their legal meaning and formality.`

    const prompt = `Translate the following legal text to ${targetLang}:

${text}

Requirements:
1. Preserve the legal meaning and formality
2. Use appropriate legal terminology in ${targetLang}
3. Maintain the structure and formatting
4. If certain legal terms have no direct translation, provide the English term with an explanation in parentheses

Provide only the translation, no explanations.`

    const translation = await generateWithXAI(prompt, systemPrompt)

    return NextResponse.json({ 
      success: true, 
      translation: translation.trim(),
      sourceLanguage: 'en',
      targetLanguage 
    })
  } catch (error: any) {
    console.error('Translation error:', error)
    return NextResponse.json({ success: false, error: error.message || 'Translation failed' }, { status: 500 })
  }
}

function _unusedMockTranslation(targetLanguage: string): string {
  const translations: Record<string, string> = {
    'yo': `Ẹ káàbọ̀ sí ìwé àdéhùn yìí. 

Àwọn ohun tó wà nínú ìwé yìí jẹ́ àdéhùn láàrín àwọn ẹgbẹ́ tó fi orúkọ wọn sílẹ̀ nísàlẹ̀.

Àwọn ẹgbẹ́ méjèèjì gbà pé:

1. A ó máa bọ̀wọ̀ fún gbogbo àwọn òfin tó wà nínú àdéhùn yìí.

2. Ẹnikẹ́ni tó bá rú àdéhùn yìí yóò san owó ìtanràn.

3. Àdéhùn yìí yóò wà fún àkókò tí a sọ.

4. Ìbéèrè èyíkéyìí yóò jẹ́ pínpín ní Ilé Ẹjọ́ Gíga Lagos.

A fi ọwọ́ wa sí ìwé yìí ní ọjọ́ tí a kọ sókè.`,

    'ig': `Nnọọ na nkwekọrịta a.

Ihe ndị dị n'ime akwụkwọ a bụ nkwekọrịta n'etiti ndị dere aha ha n'okpuru.

Ndị otu abụọ ahụ kwenyere na:

1. Anyị ga-asọpụrụ iwu niile dị na nkwekọrịta a.

2. Onye ọbụla dara iwu nkwekọrịta a ga-akwụ ụgwọ mmebi.

3. Nkwekọrịta a ga-adị n'oge a kwuru.

4. A ga-edozi nsogbu ọbụla n'Ụlọ Ikpe High Court Lagos.

Anyị detụrụ aka anyị na nke a n'ụbọchị edere n'elu.`,

    'ha': `Barka da zuwa wannan yarjejeniya.

Abubuwan da ke cikin wannan takarda yarjejeniya ce tsakanin ɓangarorin da suka sanya hannu a ƙasa.

Ɓangarori biyu sun yarda cewa:

1. Za mu mutunta duk dokoki da ke cikin wannan yarjejeniya.

2. Duk wanda ya karya wannan yarjejeniya zai biya tarar.

3. Wannan yarjejeniya za ta kasance har zuwa lokacin da aka faɗa.

4. Za a warware duk wata matsala a Babbar Kotun Lagos.

Mun sa hannu a wannan a ranar da aka rubuta a sama.`,

    'pcm': `Welcome to dis agreement.

Wetin dey inside dis paper na agreement between di people wey sign for down.

Di two sides don agree say:

1. We go respect all di rules wey dey inside dis agreement.

2. Anybody wey break dis agreement go pay penalty.

3. Dis agreement go dey valid for di time wey dem talk.

4. Any wahala go settle for Lagos High Court.

We don put our hand for dis one on di day wey dem write for up.`,

    'fr': `Bienvenue à cet accord.

Le contenu de ce document constitue un accord entre les parties signataires ci-dessous.

Les deux parties conviennent que:

1. Nous respecterons toutes les règles contenues dans cet accord.

2. Toute personne qui viole cet accord paiera une pénalité.

3. Cet accord sera valable pour la période indiquée.

4. Tout litige sera résolu devant la Haute Cour de Lagos.

Nous avons signé ceci à la date indiquée ci-dessus.`
  }

  return translations[targetLanguage] || translations['yo']
}
